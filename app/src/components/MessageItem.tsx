import EntypoIcon from '@expo/vector-icons/Entypo';
import FontAwesomeIcon from '@expo/vector-icons/FontAwesome5';
import { useEffect } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import { useSocket } from '@/context/SocketProvider';
import { logMessage } from '@/functions/helpers';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MessageItem as TMessageItem } from '@/types/chat';

const MessageItem = ({
  id,
  roomId,
  senderId,
  recipientId,
  data,
  type,
  date,
  createdAt,
  recievedAt,
  viewedAt,

  userId,
  timestamp,
}: TMessageItem & { userId: string; timestamp: number }) => {
  const { getSocket } = useSocket();

  const mutedColor = useThemeColor('muted');
  const textColor = useThemeColor('text');
  const userMsgBgColor = useThemeColor('cardAccent');
  const guestMsgBgColor = useThemeColor('card');

  const isSenderCurUser = senderId === userId;
  const isNewMessage = !isSenderCurUser && !viewedAt;
  const isRecieved = isSenderCurUser && recievedAt;
  const isViewed = isSenderCurUser && viewedAt;

  const contClassName = isSenderCurUser ? `flex-row-reverse` : `flex-row`;
  const bubbleClassName = isSenderCurUser
    ? `ml-8 rounded-br-none`
    : `mr-8 rounded-bl-none`;

  const formatTime = (): string => {
    let time = date.time;
    if (!isSenderCurUser) return time;

    const timestamp = viewedAt || recievedAt;
    if (timestamp) {
      const date = new Date(timestamp);
      time = date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return time;
  };

  const time = formatTime();

  const sendMessageViewedReport = () => {
    const socket = getSocket();
    if (!socket) {
      logMessage(`[ MSI ] Unable to send report. No socket instance`, 'error');
      return;
    }

    // Send message report
    socket.emit('message:report', {
      roomId,
      messageId: id,
      senderId,
      recipientId: userId,
      createdAt: createdAt,
      recievedAt: recievedAt,
      viewedAt: timestamp,
    });

    console.info(
      `[ F ] MSI1 Message ${id} marked as viewed. Emited 'message:report' event / sendMessageViewedReport`
    );
  };

  useEffect(() => {
    if (!isNewMessage) return;
    sendMessageViewedReport();
  }, [isNewMessage]);

  return (
    <View className={`mx-2 mb-2 ${contClassName}`}>
      {/* Message bubble */}
      <View
        className={`relative px-4 py-2 rounded-3xl ${bubbleClassName}`}
        style={{
          backgroundColor: isSenderCurUser ? userMsgBgColor : guestMsgBgColor,
        }}
      >
        {/* New message marker */}
        {isNewMessage ? (
          <View
            className="absolute top-1 left-1 w-2 h-2 rounded-full"
            style={{ backgroundColor: mutedColor }}
          ></View>
        ) : null}

        {/* Text */}
        <Text
          colorName={isSenderCurUser ? 'text' : 'title'}
          className={`font-pregular text-lg`}
        >
          {data}
          <View className={`h-2 ${isSenderCurUser ? 'w-14' : 'w-10'}`}></View>
        </Text>

        {/* Meta data */}
        <View className="h-4 absolute bottom-2 right-2 flex-row gap-1">
          <View className="-translate-x-[2px]">
            {/* Recieved / viewed mark */}
            {isViewed || isRecieved ? (
              <FontAwesomeIcon
                size={10}
                name="check"
                color={isViewed ? textColor : mutedColor}
                className="translate-y-[3px]"
              />
            ) : null}

            {/* Sent mark */}
            {!isViewed && !isRecieved && isSenderCurUser ? (
              <EntypoIcon
                size={12}
                name="paper-plane"
                color={mutedColor}
                className="translate-y-[2px]"
              />
            ) : null}
          </View>

          {/* Time */}
          <Text
            colorName="muted"
            className={`font-pmedium text-sm ${isSenderCurUser ? '' : 'pr-1'}`}
          >
            {time}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default MessageItem;
