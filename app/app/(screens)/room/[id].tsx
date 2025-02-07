import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
// import { setPRNG } from 'tweetnacl';

import MessageInput from '@/components/MessageInput';
import MessageList from '@/components/MessageList';
import { Text } from '@/components/Text';
import { useChat } from '@/core/context/ChatProvider';
import { useSession } from '@/core/context/SessionProvider';
import { useSocket } from '@/core/context/SocketProvider';
import { updateRoomMessages } from '@/core/functions/chat';
import { getRoomMessages, updateMessagesMetadata } from '@/core/functions/db';
// import { PRNG } from '@/core/functions/encryption';
import { logMessage } from '@/core/functions/helpers';
import {
  MessageEventData,
  MessageItem,
  MessageMetadataItem,
  MessageType,
} from '@/core/types/chat';
import { postUpdateMessagesMetadata } from '@/core/services/chat';
import { Image } from 'expo-image';
import NavBack from '@/components/NavBack';

// setPRNG(PRNG);

const ChatRoomScreen = () => {
  const searchParams = useLocalSearchParams();
  const { session } = useSession();
  const {
    newMessageMap,
    getRoomNewMessages,
    setCurrentRoomId,
    resetRoomNewMessages,
    markMessagesAsViewed,
    createMessage,
    handleCreatedMessage,
  } = useChat();
  const { getSocket } = useSocket();
  const [messages, setMessages] = useState<MessageItem[] | null>(null);

  const roomId = searchParams.id as string;
  const roomTitle = searchParams.title as string;
  const userId = session!.user.id;
  const token = session!.token;

  const timestamp = Date.now();
  const socket = getSocket();

  const handleMessageInputSubmit = async (input: string) => {
    if (!messages || !input.trim()) return;

    // Configure message item
    const result = await createMessage({
      input,
      type: MessageType.text,
      roomId,
    });
    if (!result) return;
    const newMessage = result;

    setMessages((messages) => [...messages!, newMessage]);
    console.info(
      `[ F ] RMS3 Newly created message is shown / handleMessageInputSubmit`
    );

    // Save message in local db, encrypt and send to server
    await handleCreatedMessage(newMessage);
  };

  const loadMessagesFromLocalDb = async (): Promise<MessageItem[]> => {
    const messagesFromLocalDb = await getRoomMessages({ roomId });
    if (!messagesFromLocalDb?.length) {
      logMessage(
        `[ RMS ] Unable to get messages from local db | loadMessagesFromLocalDb`,
        'error'
      );
      return [];
    }
    return messagesFromLocalDb;
  };

  const getMessages = async (): Promise<MessageItem[]> => {
    if (messages !== null) return messages;
    const messagesFromLocalDb = await loadMessagesFromLocalDb();
    console.info(
      `[ F ] RMS1 Room messages are fetched from local db / getMessages`
    );
    return messagesFromLocalDb;
  };

  // If we got new messages load them from local db
  const updateMessages = async () => {
    const newMessages = await getRoomNewMessages(roomId);
    if (!newMessages) return;

    const messagesFromLocalDb = await loadMessagesFromLocalDb();
    setMessages(messagesFromLocalDb);

    console.info(`[ F ] RMS2 New messages are shown / updateMessages`);
    markMessagesAsViewed(roomId, Date.now());
  };

  const onMessageUpdMetadata = async (msgEvData: MessageEventData) => {
    const errMsg = `[ RMS ] Unable to update message metadata.`;
    if (!msgEvData || msgEvData.roomId !== roomId) {
      logMessage(`${errMsg} Invalid message event data`, 'error');
      return;
    }

    const messageItems: MessageItem[] = await getMessages();
    const updMessages = updateRoomMessages(msgEvData, messageItems);
    if (!updMessages) return;
    setMessages(updMessages);
    console.info(`[ F ] RMS4 Room messages are updated / onMessageUpdMetadata`);
  };

  const listenMessageUpdMetadata = () => {
    if (!socket) {
      logMessage(`[ RMS ] Unable to get socket instance`, 'error');
      return;
    }
    socket.on('message:metadata', onMessageUpdMetadata);
  };

  const prepareRoom = async () => {
    // Set up current room id in ChatProvider
    setCurrentRoomId(roomId);
    listenMessageUpdMetadata();

    // Get messages from local db
    const messagesFromLocalDb = await getRoomMessages({ roomId });
    if (!messagesFromLocalDb) {
      setMessages([]);
      return;
    }

    // Check recently sent messages that need to update their metadata
    // (without 'recievedAt' or 'viewedAt')
    const recentSentMessages = messagesFromLocalDb
      .filter((m) => m.senderId === userId)
      .slice(-5);
    const recentUnreadMessages = recentSentMessages.filter((m) => !m.viewedAt);

    if (!recentUnreadMessages.length) {
      setMessages(messagesFromLocalDb);
      return;
    }

    // We found messages that need to be updated
    // Must use createdAt timestamp because the ObjectId
    // for those messages is not assigned yet in local db
    const createdAtArr = recentUnreadMessages.map((m) => m.createdAt);
    let messageMetadataItems: MessageMetadataItem[] = [];

    try {
      // Send request to server to update metadata
      // POST: /chat/message-metadata
      const res = await postUpdateMessagesMetadata({
        roomId,
        createdAtArr,
        userId,
        token,
      });
      if (!res?.data) {
        const errMsg =
          res?.error?.message ?? 'Unable to update messages metadata';
        logMessage(`[ RMS ] ${errMsg}`, 'error');
        return;
      }

      if (res.data.length) {
        messageMetadataItems = res.data;
        logMessage(`[ RMS ] Fetched message metadata update`);
      }
    } catch (err: any) {
      console.error(`prepareRoom ${err}`);
    }

    if (!messageMetadataItems.length) return;

    // Update messages metadata in local db
    const success = await updateMessagesMetadata(messageMetadataItems);
    if (!success) return;

    // Update local state
    const updMessagesFromLocalDb = await loadMessagesFromLocalDb();
    setMessages(updMessagesFromLocalDb);
  };

  useEffect(() => {
    // Init data, then listening on message update
    prepareRoom();

    return () => {
      // Reset the active room id in ChatProvider
      setCurrentRoomId('');
      resetRoomNewMessages(roomId);

      if (socket) {
        // Deactivate listener only for this component
        socket.off('message:metadata', onMessageUpdMetadata);

        // // Deactivate listener for the entire app
        // socket.off('message:metadata');
      }
    };
  }, []);

  useEffect(() => {
    updateMessages();
  }, [newMessageMap]);

  return (
    <KeyboardAvoidingView
      behavior="padding" // important
      style={{ flex: 1 }}
    >
      <View className="flex-1 relative">
        {/* Main content */}
        <View className="flex-1 relative z-10">
          {roomTitle && (
            <View className="relative mt-10 flex-row items-center justify-center">
              {/* Nav Back */}
              <View className="absolute top-0 left-2 w-10 h-full">
                <NavBack />
              </View>

              <Text colorName="textAlt" className="font-pbold text-3xl py-4">
                {roomTitle}
              </Text>
            </View>
          )}
          {messages && (
            <MessageList
              messages={messages}
              userId={userId}
              timestamp={timestamp}
            />
          )}
        </View>

        {/* Background image */}
        <View className="absolute flex-1 items-center justify-center inset-x-0 inset-y-0 z-0">
          <Image
            style={{ height: 160, width: 160 }}
            source={require('@/assets/images/background_logo.svg')}
            // transition={1000}
          />
        </View>
      </View>
      <MessageInput onSubmit={handleMessageInputSubmit} />
    </KeyboardAvoidingView>
  );
};

export default ChatRoomScreen;
