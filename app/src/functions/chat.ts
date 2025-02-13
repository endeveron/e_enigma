import { KEY_CAN_DECRYPT_FROM_TIMESTAMP } from '@/src/constants/store';
import { decryptMessage } from '@/src/functions/encryption';
import { logMessage } from '@/src/functions/helpers';
import { getStorageNumber, setStorageNumber } from '@/src/functions/store';
import {
  EncryptedMessage,
  Message,
  MessageEventData,
  MessageItem,
  SystemMessageCode,
} from '@/src/types/chat';

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

export const configureMessageDate = (createdAt?: number) => {
  const date: Date = new Date(createdAt ?? Date.now());
  const created = date.getTime();
  const day = date.toISOString().split('T')[0];
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const time = `${hours}:${minutes}`;

  return {
    createdAt: created,
    date: {
      day,
      time,
    },
  };
};

/**
 * Processes encrypted messages, decrypts them if possible, handles system messages,
 * and returns decrypted messages.
 * @param {EncryptedMessage[]} encryptedMessages - an array of encrypted messages
 * @returns a Promise that resolves to an array of decrypted messages (`Message[]`).
 */
export const handleRecievedMessages = async (
  encryptedMessages: EncryptedMessage[]
): Promise<{
  systemMessages: EncryptedMessage[];
  decryptedMessages: Message[];
}> => {
  if (!encryptedMessages.length)
    return {
      systemMessages: [],
      decryptedMessages: [],
    };

  const systemMessages: EncryptedMessage[] = [];
  const decryptedMessages: Message[] = [];
  const undecryptedMessageIds: string[] = [];

  // The last date timestamp, before we can't decrypt the messages
  let timestamp = 0;

  for (let m of encryptedMessages) {
    if (m.systemCode) {
      systemMessages.push(m);
      continue;
    }

    // Try to decrypt the message
    const decryptedMessage = await decryptMessage(m);
    if (decryptedMessage) {
      decryptedMessages.push(decryptedMessage);
    } else {
      undecryptedMessageIds.push(m.id);
      if (m.createdAt > timestamp) {
        timestamp = m.createdAt;
      }
    }
  }

  // Check the latest createdAt timestamp of the message we couldn't decrypt
  if (timestamp) {
    const timestampFromStorage = getStorageNumber(
      KEY_CAN_DECRYPT_FROM_TIMESTAMP
    );
    // Store the timestamp in MMKV storage
    if (!timestampFromStorage || timestampFromStorage < timestamp) {
      setStorageNumber(KEY_CAN_DECRYPT_FROM_TIMESTAMP, timestamp);
      logMessage(`[ ENC ] Messages decrypt timestamp saved in MMKV storage`);
    }

    logMessage(
      `[ ENC ] Unable to decrypt messages: ${undecryptedMessageIds.join(', ')}`,
      'warning'
    );
  }

  return {
    systemMessages,
    decryptedMessages,
  };
};
