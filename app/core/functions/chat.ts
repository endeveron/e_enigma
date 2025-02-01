import { logMessage } from '@/core/functions/helpers';
import {
  Message,
  MessageEventData,
  MessageItem,
  RoomMemberMapItem,
} from '@/core/types/chat';

export const createMessageReport = ({
  message,
  userId,
  userInRoom,
  timestamp,
}: {
  message: Message;
  userId: string;
  userInRoom: boolean;

  timestamp: number;
}): MessageEventData | undefined => {
  const errMsg = `[ HUM ] Unable to create message report.`;
  if (!message || !userId) {
    logMessage(`${errMsg} Invalid data`, 'error');
    return;
  }

  const messageReport: MessageEventData = {
    roomId: message.roomId,
    messageId: message.id,
    senderId: message.senderId,
    recipientId: userId,
    createdAt: message.createdAt,
    recievedAt: timestamp,
  };

  if (userInRoom) {
    messageReport.viewedAt = timestamp;
  }

  return messageReport;
};

export const updateRoomMessages = (
  msgEvData: MessageEventData,
  messages: MessageItem[]
): MessageItem[] | undefined => {
  const errMsg = `[ HUM ] Unable to update message.`;
  if (!msgEvData || !messages.length) {
    logMessage(`${errMsg} Invalid data`, 'error');
    return;
  }
  const msgIndex = messages.findIndex(
    (m) => m.createdAt === msgEvData.createdAt
  );
  if (msgIndex === -1) return;

  // It is obvious that the user is currently in the room

  // Update message metadata
  const updMessages = [...messages];
  const message = messages[msgIndex];
  message.recievedAt = msgEvData.recievedAt;
  message.viewedAt = msgEvData.viewedAt;
  if (msgEvData.messageId !== message.id) {
    message.id = msgEvData.messageId;
  }
  updMessages[msgIndex] = message;

  return updMessages;
};

export const configureMessageDate = (): {
  createdAt: number; // timestamp
  date: {
    day: string; // YYYY-MM-DD
    time: string; // hh:mm
  };
} => {
  const date = new Date();
  const createdAt = date.getTime();
  const day = date.toISOString().split('T')[0];
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const time = `${hours}:${minutes}`;

  return {
    createdAt,
    date: {
      day,
      time,
    },
  };
};
