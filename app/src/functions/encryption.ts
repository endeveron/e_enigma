import {
  decode as decodeBase64,
  encode as encodeBase64,
} from '@stablelib/base64';
import { decode as decodeUTF8, encode as encodeUTF8 } from '@stablelib/utf8';
import * as Crypto from 'expo-crypto';
import { box, randomBytes, setPRNG } from 'tweetnacl';

import {
  KEY_CAN_DECRYPT_FROM_TIMESTAMP,
  KEY_SECRET_KEY,
  KEY_USER_ID_LIST,
} from '@/constants/store';
import { logMessage } from '@/functions/helpers';
import {
  getSecureStoreItem,
  getStorageNumber,
  setSecureStoreItem,
  setStorageNumber,
} from '@/functions/store';
import {
  CreateMessageReqData,
  DecryptedMessageData,
  EncryptedMessage,
  Message,
  MessageDate,
  MessageItem,
} from '@/types/chat';
import { EncryptionKeypair } from '@/types/auth';
import { configureMessageDate } from '@/functions/chat';

// Set the PRNG for tweetnacl
setPRNG((x: Uint8Array, n: number) => {
  const randomBytes = Crypto.getRandomBytes(n);
  for (let i = 0; i < n; i++) {
    x[i] = randomBytes[i];
  }
});

export const generateKeyPair = () => box.keyPair();

export const base64StringToUint8Array = (base64String: string): Uint8Array => {
  const binaryString = atob(base64String);
  const length = binaryString.length;
  const array = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    array[i] = binaryString.charCodeAt(i);
  }
  return array;
};

export const uint8ArrayToBase64String = (uint8Array: Uint8Array): string => {
  return btoa(String.fromCharCode(...uint8Array));
};

export const generateEncryptionKeys = (): EncryptionKeypair | null => {
  const keyData = generateKeyPair();
  if (!keyData) {
    return null;
  }
  return {
    publicKeyBase64: uint8ArrayToBase64String(keyData.publicKey),
    secretKeyBase64: uint8ArrayToBase64String(keyData.secretKey),
  };
};

export const encrypt = (
  secretOrSharedKey: Uint8Array,
  json: any,
  key?: Uint8Array
) => {
  const nonce = randomBytes(box.nonceLength);
  const messageUint8 = encodeUTF8(JSON.stringify(json));
  const encrypted = key
    ? box(messageUint8, nonce, key, secretOrSharedKey)
    : box.after(messageUint8, nonce, secretOrSharedKey);

  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce);
  fullMessage.set(encrypted, nonce.length);

  const base64FullMessage = encodeBase64(fullMessage);
  return base64FullMessage;
};

export const decrypt = (
  secretOrSharedKey: Uint8Array,
  messageWithNonce: string,
  key?: Uint8Array
): DecryptedMessageData | null => {
  const messageWithNonceAsUint8Array = decodeBase64(messageWithNonce);
  const nonce = messageWithNonceAsUint8Array.slice(0, box.nonceLength);
  const message = messageWithNonceAsUint8Array.slice(
    box.nonceLength,
    messageWithNonce.length
  );

  const decrypted = key
    ? box.open(message, nonce, key, secretOrSharedKey)
    : box.open.after(message, nonce, secretOrSharedKey);

  if (!decrypted) {
    // throw new Error('Could not decrypt message');
    return null;
  }

  const base64DecryptedMessage = decodeUTF8(decrypted);
  return JSON.parse(base64DecryptedMessage);
};

export const genrateSharedKey = async (
  userPublicKeyBase64: string
): Promise<string | undefined> => {
  // Get secret key from secure store
  const secretKeyBase64 = await getSecureStoreItem(KEY_SECRET_KEY);
  if (!secretKeyBase64) {
    logMessage(
      `[ ENC ] Unable to get secret key to generate shared key`,
      'error'
    );
    return;
  }

  const publicKey = base64StringToUint8Array(userPublicKeyBase64);
  const secretKey = base64StringToUint8Array(secretKeyBase64);
  const sharedKeyUnit8Arr = box.before(publicKey, secretKey);
  const sharedKeyBase64 = uint8ArrayToBase64String(sharedKeyUnit8Arr);

  return sharedKeyBase64;
};

export const createAndStoreSharedKey = async (
  userId: string,
  userPublicKeyBase64: string
): Promise<boolean> => {
  const sharedKeyBase64 = await genrateSharedKey(userPublicKeyBase64);
  if (!sharedKeyBase64) {
    logMessage(`[ ENC ] Unable to generate shared key`, 'error');
    return false;
  }

  // Save shared key in SecureStore
  const isSaved = await getSecureStoreItem(`shared_${userId}`);
  if (!isSaved) {
    const saveKeySuccess = await setSecureStoreItem(
      `shared_${userId}`,
      sharedKeyBase64
    );
    if (saveKeySuccess) {
      logMessage(`[ CHP ] Shared key for user ${userId} saved in secure store`);
    } else {
      logMessage(
        `[ CHP ] Unable to save shared key for user ${userId}`,
        'error'
      );
      return false;
    }
  }

  let userIdList: string[] = [];

  // Get user id list from SecureStore
  const userIdListStr = await getSecureStoreItem(KEY_USER_ID_LIST);
  if (userIdListStr) {
    userIdList = userIdListStr.split(',');
  }

  // Add user id to the userList and save in SecureStore
  userIdList.push(userId);
  const updUserIdListStr = userIdList.join(',');
  const saveListSuccess = await setSecureStoreItem(
    KEY_USER_ID_LIST,
    updUserIdListStr
  );
  if (!saveListSuccess) {
    logMessage(`[ CHP ] Unable to update list of shared keys`, 'error');
    return false;
  }

  return true;
};

export const updateSharedKey = async (
  userId: string,
  userPublicKeyBase64: string
): Promise<boolean> => {
  const sharedKeyBase64 = await genrateSharedKey(userPublicKeyBase64);
  if (!sharedKeyBase64) {
    logMessage(`[ ENC ] Unable to generate shared key`, 'error');
    return false;
  }

  // Update shared key in SecureStore
  const saveKeySuccess = await setSecureStoreItem(
    `shared_${userId}`,
    sharedKeyBase64
  );
  if (saveKeySuccess) {
    logMessage(`[ CHP ] Shared key for user ${userId} updated in secure store`);
    return true;
  }
  logMessage(`[ CHP ] Unable to update shared key for user ${userId}`, 'error');
  return false;
};

/* Get shared key from SecureStore */
export const getSharedKeyUnit8Arr = async (
  userId: string
): Promise<Uint8Array | null> => {
  try {
    const keyBase64 = await getSecureStoreItem(`shared_${userId}`);
    if (!keyBase64) return null;
    return base64StringToUint8Array(keyBase64);
  } catch (err: any) {
    console.error(err);
    return null;
  }
};

export const encryptMessage = async ({
  messageItem,
  userId,
}: {
  messageItem: MessageItem;
  userId: string;
}): Promise<CreateMessageReqData | null> => {
  if (!messageItem) return null;

  try {
    const recipientId = messageItem.recipientId;

    const sharedKeyBase64 = await getSecureStoreItem(`shared_${recipientId}`);
    if (!sharedKeyBase64) {
      logMessage(`[ ENC ] Unable to get shared key`, 'error');
      return null;
    }
    const sharedKey = base64StringToUint8Array(sharedKeyBase64!);
    const data = {
      data: messageItem.data,
      type: messageItem.type,
      date: messageItem.date,
    };
    const encryptedData = encrypt(sharedKey, data);

    return {
      roomId: messageItem.roomId,
      senderId: userId,
      data: encryptedData,
      createdAt: messageItem.createdAt,
    };
  } catch (err: any) {
    console.error(err);
    return null;
  }
};

export const decryptMessage = async (
  encryptedMessage: EncryptedMessage
): Promise<Message | null> => {
  const { data: encryptedData, ...messageData } = encryptedMessage;
  const senderId = messageData.senderId;

  const sharedKey = await getSharedKeyUnit8Arr(senderId);
  if (!sharedKey) return null;

  // Try to decrypt message
  const decryptedData: DecryptedMessageData | null = decrypt(
    sharedKey,
    encryptedData
  );
  if (!decryptedData) return null;

  return {
    ...messageData,
    ...decryptedData,
  };
};
