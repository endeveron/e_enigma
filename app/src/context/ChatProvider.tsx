import { useRouter } from 'expo-router';
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Socket } from 'socket.io-client';

import {
  KEY_CAN_DECRYPT_FROM_TIMESTAMP,
  KEY_DATA_FETCHED,
  KEY_PUBLIC_KEY,
} from '@/constants/store';
import { EventType, useEvent } from '@/context/EventProvider';
import { useSession } from '@/context/SessionProvider';
import {
  configureMessageDate,
  createMessageReport,
  handleRecievedMessages,
} from '@/functions/chat';
import {
  deleteInvitation as deleteInvitationFromLocalDb,
  getInvitations as getInvitationsFromLocalDb,
  getMessagesById,
  getRoomMemberId,
  getRoomMemberMap,
  insertInvitations,
  insertMessageItems,
  insertRoomItems,
  insertRoomMember,
  insertRoomMembers,
  markMessagesAsViewed as markLocalDbMessagesAsViewed,
  saveChatDataInLocalDb,
  saveMessagesInLocalDb,
  updateMessageMetadataOnEvent,
} from '@/functions/db';
import {
  createAndStoreSharedKey,
  decryptMessage,
  encryptMessage,
  updateSharedKey,
} from '@/functions/encryption';
import { logMessage } from '@/functions/helpers';
import {
  checkStorageItem,
  getSecureStoreItem,
  getStorageNumber,
  setStorageItem,
} from '@/functions/store';
import {
  deleteInvitation as deleteInvitationFromRemoteDb,
  deleteMessage,
  getInitialData,
  getInvitations as getInvitationsFromServer,
  getNewMessages,
  getRooms,
  postRoom,
  sendMessage,
} from '@/services/chat';
import {
  EncryptedMessage,
  InvitationAnswerData,
  Message,
  MessageEventData,
  MessageItem,
  MessageType,
  RoomItem,
  RoomMember,
  RoomMemberMapItem,
  SystemMessageCode,
  UserItem,
} from '@/types/chat';

type TChatContext = {
  newMessageMap: Map<string, string[]>;
  roomMemberMap: Map<string, RoomMemberMapItem>;
  recievedInvitations: UserItem[];
  rejectInvitation: (roomCreatorId: string) => Promise<boolean>;
  acceptInvitation: (roomCreator: UserItem) => Promise<boolean>;
  setCurrentRoomId: (roomId: string) => void;
  getCurrentRoomId: () => string;
  resetRoomNewMessages: (roomId: string) => void;
  markMessagesAsViewed: (roomId: string, viewedAt: number) => void;
  getRoomNewMessages: (roomId: string) => Promise<MessageItem[] | null>;
  onInvitation: (
    arg:
      | { type: 'offer'; data: UserItem }
      | { type: 'answer'; data: InvitationAnswerData }
  ) => void;

  createMessage: (data: {
    input: string;
    type: MessageType;
    roomId: string;
  }) => Promise<MessageItem | null>;
  handleCreatedMessage: (message: MessageItem) => Promise<boolean>;
  onMessage: (message: EncryptedMessage, socket: Socket) => void;
  onMessageUpdMetadata: (data: MessageEventData) => void;
};

const ChatContext = createContext<TChatContext>({
  newMessageMap: new Map(),
  roomMemberMap: new Map(),
  recievedInvitations: [],
  rejectInvitation: async () => false,
  acceptInvitation: async () => false,
  getCurrentRoomId: () => '',
  setCurrentRoomId: () => {},
  resetRoomNewMessages: () => {},
  markMessagesAsViewed: () => {},
  getRoomNewMessages: async () => null,
  onInvitation: () => {},

  createMessage: async () => null,
  handleCreatedMessage: async () => false,
  onMessage: () => {},
  onMessageUpdMetadata: () => {},
});

export const useChat = () => {
  const value = useContext(ChatContext);
  if (process.env.NODE_ENV !== 'production') {
    if (!value) {
      throw new Error('useChat must be wrapped in a <ChatProvider />');
    }
  }
  return value;
};

const ChatProvider = ({ children }: PropsWithChildren) => {
  const { session } = useSession();
  const { event, emitEvent } = useEvent();
  const router = useRouter();

  const token = session!.token;
  const userId = session!.user.id;
  const userName = session!.user.account.name;
  const userImageUrl = session!.user.account.imageUrl;

  const [roomMemberMap, setRoomMemberMap] = useState<
    Map<string, RoomMemberMapItem>
  >(new Map());
  const [newMessageMap, setNewMessageMap] = useState<Map<string, string[]>>(
    new Map()
  );
  const [recievedInvitations, setRecievedInvitations] = useState<UserItem[]>(
    []
  );

  const curRoomIdRef = useRef('');
  const newMsgMapRef = useRef<Map<string, string[]>>(new Map());

  const deleteRecievedInvitation = async (
    roomCreatorId: string
  ): Promise<boolean> => {
    // Send request to server to delete the invitation
    // DELETE: /chat/invitation?roomCreatorId=<roomCreatorId>&invitedUserId=<invitedUserId>
    const res = await deleteInvitationFromRemoteDb({
      invitedUserId: userId,
      roomCreatorId,
      token,
    });

    if (!res?.data) {
      const errMsg =
        res?.error?.message ?? 'Unable to delete invitation from the remote db';
      logMessage(`[ CHP ] ${errMsg}`, 'error');
      return false;
    }
    logMessage(
      `[ CHP ] Invitation deleted from remote db / deleteRecievedInvitation`,
      'success'
    );

    // Remove invitation record from local db 'invitation_recieved'
    const localDbSuccess = await deleteInvitationFromLocalDb(
      roomCreatorId,
      'recieved'
    );
    if (!localDbSuccess) return false;
    logMessage(
      `[ CHP ] Invitation record deleted from local db / deleteRecievedInvitation`,
      'success'
    );

    // Update recieved invitations
    const updInvitations = [...recievedInvitations].filter(
      (data) => data.id !== roomCreatorId
    );
    setRecievedInvitations(updInvitations);
    logMessage(
      `[ CHP ] Invitation state updated / deleteRecievedInvitation`,
      'success'
    );

    // Redirect to home screen if the invitation list is empty
    if (updInvitations.length === 0) router.push('/');

    return true;
  };

  const acceptInvitation = async (roomCreator: UserItem): Promise<boolean> => {
    const roomCreatorId = roomCreator.id;
    try {
      // Send request to server to create a new room
      // POST: /chat/room
      const res = await postRoom({
        roomCreatorId,
        invitedUserId: userId,
        token,
      });
      if (!res?.data) {
        const errMsg = res?.error?.message ?? 'Unable to create a chat room';
        logMessage(`[ CHP ] ${errMsg}`, 'error');
        return false;
      }
      const { roomId, updatedAt, roomCreatorPublicKey } = res.data;
      logMessage(
        `[ CHP ] Room saved in remote db / acceptInvitation`,
        'success'
      );

      // Save room item in local db 'room'
      const roomItem: RoomItem = {
        id: roomId,
        memberId: roomCreatorId,
        newMsgCount: 0,
        updatedAt,
      };
      const saveRoomSuccess = await insertRoomItems([roomItem]);
      if (!saveRoomSuccess) return false;
      logMessage(
        `[ CHP ] Room item saved in local db / acceptInvitation`,
        'success'
      );

      // Save room creator in local db 'room_member'
      const saveRoomCreatorSuccess = await insertRoomMember({
        ...roomCreator,
        publicKey: roomCreatorPublicKey,
      });
      if (!saveRoomCreatorSuccess) return false;
      logMessage(
        `[ CHP ] Room member saved in local db / acceptInvitation`,
        'success'
      );

      // Add room creator to the map
      const updRoomMemberMap = new Map(roomMemberMap);
      updRoomMemberMap.set(roomCreatorId, {
        name: roomCreator.name,
        publicKey: roomCreatorPublicKey,
        imageUrl: roomCreator.imageUrl,
      });
      setRoomMemberMap(updRoomMemberMap);
      logMessage(
        `[ CHP ] Room member map updated / acceptInvitation`,
        'success'
      );

      // Create shared key for room creator and save it to SecureStore
      const sharedKeySuccess = await createAndStoreSharedKey(
        roomCreatorId,
        roomCreatorPublicKey
      );
      if (!sharedKeySuccess) return false;

      const deleteInvitationSuccess = await deleteRecievedInvitation(
        roomCreator.id
      );
      if (!deleteInvitationSuccess) return false;

      // Emit event ROOM_MEMBER_MAP_UPD for HomeScreen
      emitEvent({
        type: EventType.ROOM_MEMBER_MAP_UPD,
      });

      return true;
    } catch (err: any) {
      logMessage(`acceptInvitation`, 'error');
      console.error(err);
      return false;
    }
  };

  const rejectInvitation = async (roomCreatorId: string) => {
    const success = await deleteRecievedInvitation(roomCreatorId);
    return success;
  };

  const addRoomMembersToMap = (
    roomMembers: RoomMember[]
  ): Map<string, RoomMemberMapItem> => {
    const roomMemberMap = new Map<string, RoomMemberMapItem>();
    for (let m of roomMembers) {
      roomMemberMap.set(m.id, {
        name: m.name,
        publicKey: m.publicKey,
        imageUrl: m.imageUrl,
      });
    }
    return roomMemberMap;
  };

  const addNewMessagesToMap = (
    messages: Message[],
    isCurUserMessages: boolean
  ): Map<string, string[]> | null => {
    const newMsgMap = new Map<string, string[]>();
    let isUpdated = false;
    for (let m of messages) {
      const roomId = m.roomId;
      const msgId = m.id;

      if (!isCurUserMessages) {
        // Find the current user in the message recipient list
        // // const curUser = m.recipients.filter((r) => r.userId === userId)[0];
        const curUser = m.recipientId === userId;
        if (!curUser || m.viewedAt !== undefined) continue;
      }

      // Add message to the room message list
      const roomMessages = newMessageMap.get(roomId) ?? [];
      if (roomMessages.includes(msgId)) continue;

      // Update the room data
      roomMessages.push(msgId);
      newMsgMap.set(roomId, roomMessages);
      if (!isUpdated) isUpdated = true;
    }
    return isUpdated ? newMsgMap : null;
  };

  const updateNewMsgMap = (updNewMsgMap: Map<string, string[]>) => {
    setNewMessageMap(updNewMsgMap);
    newMsgMapRef.current = updNewMsgMap;
  };

  const handleSystemMessages = async (
    messages: EncryptedMessage[]
  ): Promise<boolean> => {
    let error = false;

    for (let m of messages) {
      // systemCode E001 - 'encryption keys are changed'
      if (m.systemCode === SystemMessageCode.E001) {
        const senderId = m.senderId;

        // Go to the next iteration if the current user is the sender
        if (senderId === userId) continue;

        const publicKey = m.data;
        if (!senderId || !publicKey) {
          const errMsg = `Unable to update shared key for user ${senderId}. Invalid system message data`;
          logMessage(`[ CHP ] ${errMsg}`, 'error');
          error = true;
          continue;
        }

        // Update shared key
        const keySuccess = await updateSharedKey(senderId, publicKey);
        if (keySuccess) {
          logMessage(
            `[ CHP ] Updated shared key for user ${senderId}`,
            'success'
          );

          // Delete system message in remote db
          const deleteSuccess = await deleteMessage({
            roomId: m.roomId,
            token,
          });
          if (!deleteSuccess) {
            const errMsg = `Unable to delete system message ${m.systemCode} for room ${m.roomId} in remote db`;
            logMessage(`[ CHP ] ${errMsg}`, 'error');
            error = true;
            continue;
          }
        }
      }
    }

    return !error;
  };

  const fetchChatDataAfterAppInstall = async () => {
    // Recieve the room member map, user's rooms and messages from the server
    // GET: /chat/data?userId=<userId>
    const res = await getInitialData({ userId, token });
    const data = res?.data;
    if (!data) {
      const errMsg =
        res?.error?.message ?? 'Unable to get chat data from the server';
      logMessage(`[ CHP ] ${errMsg}`, 'error');
      return;
    }
    const {
      roomItems,
      roomMembers,
      messages: encryptedMessages,
      invitations,
    } = data;
    console.info(
      `[ F ] INI1 Recieved ${roomItems.length} rooms, ${roomMembers.length} room members and ${encryptedMessages.length} messages / initChatData`
    );
    if (!roomItems.length || !roomMembers.length) {
      if (encryptedMessages.length) {
        logMessage(`[ CHP ] Invalid chat data`, 'error');
        return;
      }
    }

    // Add room members to map
    const updRoomMemberMap = addRoomMembersToMap(roomMembers);
    // Add current user to map
    const curUserPublicKeyBase64 = await getSecureStoreItem(KEY_PUBLIC_KEY);
    if (!curUserPublicKeyBase64) {
      logMessage(`[ CHP ] Unable to get public key for current user`, 'error');
      return;
    }

    updRoomMemberMap.set(userId, {
      name: userName,
      publicKey: curUserPublicKeyBase64,
      imageUrl: userImageUrl,
    });

    console.info(`[ F ] INI2 Room member map updated / initChatData`);
    setRoomMemberMap(updRoomMemberMap);

    try {
      // Create shared key for current user and save it to SecureStore
      const curUserSharedKeySuccess = await createAndStoreSharedKey(
        userId,
        curUserPublicKeyBase64
      );
      if (!curUserSharedKeySuccess) {
        logMessage(
          `[ CHP ] Unable to save shared key for current user`,
          'error'
        );
        return;
      }

      // Create shared keys for room members
      for (let m of roomMembers) {
        const success = await createAndStoreSharedKey(m.id, m.publicKey);
        if (!success) return;
      }
      console.info(`[ F ] INI3 Shared keys created / initChatData`);

      // Decrypt recieved messages, get system messages
      let messages: Message[] = [];
      const { systemMessages, decryptedMessages } =
        await handleRecievedMessages(encryptedMessages);

      if (decryptedMessages.length) {
        // Add new messages to the map
        const updNewMsgMap = addNewMessagesToMap(decryptedMessages, false);
        if (updNewMsgMap) {
          updateNewMsgMap(updNewMsgMap);
          console.info(`[ F ] INI4 New message map updated / fetchChatData`);
        }
      }

      if (systemMessages.length) {
        const sysMsgSuccess = await handleSystemMessages(systemMessages);
      }

      // Store recieved data in local db
      const success = await saveChatDataInLocalDb({
        roomItems,
        roomMemberMap: updRoomMemberMap,
        invitations,
        messages,
      });
      if (success) {
        // console.info(`[ F ] INI5 Data added to local db / initChatData`);
        setStorageItem(KEY_DATA_FETCHED);

        if (roomItems.length) {
          // Emit an event to update room list on /(screens)/index.tsx
          emitEvent({ type: EventType.FIRST_INIT });
        }
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const getRoomMemberMapFromLocalDb = async (): Promise<
    Map<string, RoomMemberMapItem>
  > => {
    const memberMap = await getRoomMemberMap();
    console.info(
      `[ F ] CHP1 Room member map fetched from local db / getRoomMemberMapFromLocalDb`
    );
    return memberMap;
  };

  const initRooms = async () => {
    logMessage(`[ CHP ] Initialize rooms`);
    // GET: /chat/rooms?userId=<userId>
    const res = await getRooms({ userId, token });
    if (!res?.data) {
      const errMsg =
        res?.error?.message ?? 'Unable to get rooms from the server';
      logMessage(`[ CHP ] ${errMsg}`, 'error');
      return;
    }

    const { roomItems, roomMembers } = res.data;
    if (!roomItems?.length || !roomMembers?.length) return;

    const memberMap = await getRoomMemberMapFromLocalDb();

    // Check for new room members
    const newRoomMembers: RoomMember[] = [];
    for (let m of roomMembers) {
      if (!memberMap.has(m.id)) {
        newRoomMembers.push(m);
      }
    }
    if (!newRoomMembers.length) return;

    const updRoomMemberMap = new Map(memberMap);
    for (let m of newRoomMembers) {
      // Add room member to map
      updRoomMemberMap.set(m.id, {
        name: m.name,
        publicKey: m.publicKey,
        imageUrl: m.imageUrl,
      });

      // Create shared key for room member and save it to SecureStore
      const sharedKeySuccess = await createAndStoreSharedKey(m.id, m.publicKey);
      if (!sharedKeySuccess) return;
    }

    // Update member map
    setRoomMemberMap(updRoomMemberMap);

    // Save room members in local db
    await insertRoomMembers(updRoomMemberMap);

    // Save rooms in local db
    await insertRoomItems(roomItems);

    // Emit event ROOM_MEMBER_MAP_UPD for HomeScreen
    emitEvent({
      type: EventType.ROOM_MEMBER_MAP_UPD,
    });
  };

  const initMessages = async () => {
    // Get the last date timestamp, before we can't decrypt the messages
    const timestamp = getStorageNumber(KEY_CAN_DECRYPT_FROM_TIMESTAMP);

    // Recieve new messages from the server
    // GET: /chat/new-messages?userId=<userId>
    const res = await getNewMessages({ userId, token, timestamp });
    if (!res?.data) {
      const errMsg =
        res?.error?.message ?? 'Unable to get new messages from the server';
      logMessage(`[ CHP ] ${errMsg}`, 'error');
      return;
    }
    const encryptedNewMessages = res.data;
    const newMsgArrlng = encryptedNewMessages.length;
    if (!newMsgArrlng) return;
    console.info(
      `[ F ] CHP2 Fetched ${newMsgArrlng} new message${
        newMsgArrlng === 1 ? '' : 's'
      } / initNewMessages`
    );

    // Get room member map from local db
    const memberMap = await getRoomMemberMapFromLocalDb();

    // Decrypt recieved messages, get system messages
    const { systemMessages, decryptedMessages } = await handleRecievedMessages(
      encryptedNewMessages
    );

    if (decryptedMessages.length) {
      // Add new messages to the map
      const updNewMsgMap = addNewMessagesToMap(decryptedMessages, true);
      if (updNewMsgMap) {
        updateNewMsgMap(updNewMsgMap);
        console.info(`[ F ] CHP3 New message map updated / initNewMessages`);

        // Add messages to the 'message' table
        const addToDb = await saveMessagesInLocalDb(
          decryptedMessages,
          memberMap
        );
        if (addToDb) {
          console.info(
            `[ F ] CHP4 New messages are synchronized with local db / initNewMessages`
          );
        }
      } else {
        console.info(
          `[ F ] CHP3 Local data is up-to-date, no updates required / initNewMessages`
        );
      }
    }

    if (systemMessages.length) {
      // const sysMsgSuccess = await handleSystemMessages(systemMessages);
      await handleSystemMessages(systemMessages);
    }
  };

  const initRecievedInvitations = async () => {
    // Recieve invitations adressed to the current user
    // GET: /chat/invitations?userId=<userId>
    const res = await getInvitationsFromServer({ userId, token });
    const userItems = res?.data;
    if (!userItems) {
      const errMsg =
        res?.error?.message ?? 'Unable to get user invitations from the server';
      logMessage(`[ CHP ] ${errMsg}`, 'error');
      return;
    }

    if (!userItems.length) return;

    logMessage(`[ CHP ] Recieved invitations: ${userItems.length}`);
    setRecievedInvitations(userItems);

    // Save invitations in local db
    await insertInvitations(userItems, 'recieved', true);
  };

  const initData = async () => {
    const dataFetched = checkStorageItem(KEY_DATA_FETCHED);
    if (!dataFetched) {
      await fetchChatDataAfterAppInstall();
      return;
    }

    await initRooms();
    await initMessages();
    await initRecievedInvitations();
  };

  const getCurrentRoomId = (): string => {
    return curRoomIdRef.current;
  };

  const setCurrentRoomId = (roomId: string): void => {
    curRoomIdRef.current = roomId;
  };

  const resetRoomNewMessages = (roomId: string) => {
    // Remove room key from the new messages map
    const updNewMsgMap = new Map(newMessageMap);
    updNewMsgMap.set(roomId, []);
    updateNewMsgMap(updNewMsgMap);
    console.info(
      `[ F ] CHP5 Current room id deleted from newMessageMap / resetRoomNewMessages`
    );
  };

  const markMessagesAsViewed = async (roomId: string, timestamp: number) => {
    const messageIdArr = newMessageMap.get(roomId);
    if (!messageIdArr?.length) return;

    // Update messages in local db
    const markSuccess = await markLocalDbMessagesAsViewed({
      messageIdArr,
      userId,
      timestamp,
    });
    if (markSuccess) {
      console.info(
        `[ F ] CHP6 New meesages are marked as viewed in local db / markMessagesAsViewed`
      );
    }

    resetRoomNewMessages(roomId);
  };

  const getRoomNewMessages = async (roomId: string) => {
    const messageIdArr = newMessageMap.get(roomId);
    if (!messageIdArr?.length) return null;

    const newMessages = await getMessagesById({
      messageIdArr,
    });

    return newMessages;
  };

  const createMessage = async ({
    input,
    roomId,
    type,
  }: {
    input: string;
    type: MessageType;
    roomId: string;
  }) => {
    const { createdAt, date } = configureMessageDate();

    const recipientId = await getRoomMemberId(roomId);
    if (!recipientId) {
      logMessage(
        `Unable to create message. Could not get room member id`,
        'error'
      );
      return null;
    }

    const messageItem: MessageItem = {
      id: createdAt.toString(), // Temporary, until got the server response
      roomId,
      senderId: userId,
      recipientId,
      data: input,
      type,
      date,
      createdAt,
    };
    console.info(`[ F ] CHP7 Message created / createMessage`);

    return messageItem;
  };

  const handleCreatedMessage = async (messageItem: MessageItem) => {
    // Save message in local db, encrypt and send to server

    // Save message in local db
    const saveSuccess = await insertMessageItems([messageItem]);
    if (!saveSuccess) return false;
    console.info(`[ F ] CHP8 Message saved in local db / handleCreatedMessage`);

    // Encrypt message data
    const reqData = await encryptMessage({
      messageItem,
      userId,
    });

    if (!reqData) {
      logMessage(`[ CHP ] Unable to encrypt message`, 'error');
      return false;
    }

    // Send message data to server
    const res = await sendMessage({
      data: reqData,
      token,
    });
    if (!res.data) {
      const errMsg = `[ CHP ] Unable to handle message. ${
        res.error ? res.error.message : 'Invalid server response'
      }`;
      logMessage(errMsg, 'error');
      return false;
    }
    console.info(`[ F ] CHP9 Message sent to server / handleCreatedMessage`);

    return true;
  };

  const onInvitation = async ({
    type,
    data,
  }:
    | { type: 'offer'; data: UserItem }
    | { type: 'answer'; data: InvitationAnswerData }) => {
    if (type === 'answer') {
      if (data.event === 'accepted') await initRooms();

      // Remove invitation record from local db 'invitation_sent'
      const localDbSuccess = await deleteInvitationFromLocalDb(data.to, 'sent');
      if (!localDbSuccess) return false;
      logMessage(
        `[ CHP ] Invitation record deleted from local db / onInvitation`,
        'success'
      );

      // After the invitation record was removed from local db
      // emit event INVITATION_ANSWER for SearchScreen
      emitEvent({
        type: EventType.INVITATION_ANSWER,
        payload: data.event,
      });
    }

    if (type === 'offer') {
      const recInvitFromLocalDb = await getInvitationsFromLocalDb('recieved');
      const updRecievedInvitations = [...recInvitFromLocalDb, data];
      setRecievedInvitations(updRecievedInvitations);
    }
  };

  const onMessage = async (
    encryptedMessage: EncryptedMessage,
    socket: Socket
  ) => {
    const errMsg = `[ CHP ] Unable to handle recieved message.`;
    if (!newMsgMapRef.current) {
      logMessage(`${errMsg} New messages map not initialized`, 'error');
      return;
    }
    if (!encryptedMessage) {
      logMessage(`${errMsg} Invalid message data`, 'error');
      return;
    }
    logMessage(`[ CHP ] New message recieved ${encryptedMessage.id}`);

    let mbrMap: Map<string, RoomMemberMapItem> | null = roomMemberMap;
    if (!roomMemberMap.size) {
      mbrMap = await getRoomMemberMapFromLocalDb();
      if (!mbrMap) {
        logMessage(`${errMsg} Unable to initialize room member map`, 'error');
        return;
      }
    }

    // Decrypt message
    const message = await decryptMessage(encryptedMessage);
    if (!message) {
      logMessage(`[ CHP ] Unable to decrypt recieved message`, 'error');
      return;
    }
    logMessage(`[ CHP ] Received message has been decrypted`);

    // Update metadata
    const timestamp = Date.now();
    const userInRoom = curRoomIdRef.current === message.roomId;
    if (userInRoom) message.viewedAt = timestamp;
    message.recievedAt = timestamp;

    // Save message in local db
    const saveSuccess = await saveMessagesInLocalDb([message], mbrMap);
    if (!saveSuccess) return false;
    console.info(`[ F ] CHP10 Message saved in local db / onMessage`);

    // Add message id to newMsgMapRef
    const messageIdArr = newMsgMapRef.current.get(message.roomId) || [];
    messageIdArr.push(message.id);
    const updNewMsgMap = new Map(
      newMsgMapRef.current.set(message.roomId, messageIdArr)
    );
    updateNewMsgMap(updNewMsgMap);
    console.info(`[ F ] CHP11 New message map updated / onMessage`);

    // Create message report
    const messageReport = createMessageReport({
      message,
      userId,
      userInRoom,
      timestamp,
    });
    if (!messageReport) return;

    // Emit message report (recievedAt)
    socket.emit('message:report', messageReport);
    console.info(`[ F ] CHP12 Message report emmited / onMessage`);
  };

  const onMessageUpdMetadata = async (msgEvData: MessageEventData) => {
    const errMsg = `[ CHP ] Unable to update message metadata.`;
    if (!msgEvData) {
      logMessage(`${errMsg} Invalid message event data`, 'error');
      return;
    }
    if (msgEvData.senderId !== userId) {
      logMessage(`${errMsg} Invalid sender`, 'error');
      return;
    }
    logMessage(`[ CHP ] Message update recieved ${msgEvData}`);

    // Update message metadata in local db
    const updSuccess = await updateMessageMetadataOnEvent(msgEvData);
    if (updSuccess) {
      console.info(
        `[ F ] CHP13 Message updated in local db / onMessageUpdMetadata`
      );
    }
  };

  useEffect(() => {
    initData();
    // return () => {};
  }, []);

  // useEffect(() => {
  //   console.log('[ CHP ] roomMemberMap', roomMemberMap);
  // }, [roomMemberMap]);

  // useEffect(() => {
  //   console.log('[ CHP ] newMessageMap', [...newMessageMap]);
  // }, [newMessageMap]);

  // useEffect(() => {
  //   console.log('[ CHP ] recievedInvitations', recievedInvitations);
  // }, [recievedInvitations]);

  const value = {
    newMessageMap,
    roomMemberMap,
    recievedInvitations,
    acceptInvitation,
    rejectInvitation,
    getCurrentRoomId,
    setCurrentRoomId,
    resetRoomNewMessages,
    markMessagesAsViewed,
    getRoomNewMessages,
    createMessage,
    handleCreatedMessage,
    onInvitation,
    onMessage,
    onMessageUpdMetadata,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatProvider;
