import * as SecureStore from 'expo-secure-store';
// import * as Keychain from 'react-native-keychain';
import { MMKV } from 'react-native-mmkv';

/** MMKV Storage */
const storage = new MMKV();

/**
 * Checks whether the MMKV storage contains the item with the provided key.
 * @returns a boolean
 */
export const checkStorageItem = (key: string): boolean => {
  return storage.contains(key);
};

/**
 * Retrieves a number by the provided key from the MMKV storage.
 * @returns a boolean
 */
export const getStorageNumber = (key: string): number | undefined => {
  return storage.getNumber(key);
};

/**
 * Stores a number with the provided key in the MMKV storage.
 */
export const setStorageNumber = (key: string, number: number): void => {
  storage.set(key, number);
};

/**
 * Stores an item with the provided key and value '1' in the MMKV storage.
 */
export const setStorageItem = (key: string): void => {
  storage.set(key, '1');
};

/**
 * Removes the item with the provided key from the MMKV storage.
 */
export const deleteStorageItem = (key: string): void => {
  storage.delete(key);
};

/** Secure Store */

/**
 * Stores data securely using SecureStore.
 * @param {string} key - a string that represents the identifier or key under
 * which the data will be stored in the SecureStore.
 * @param {string} data - the string value that you want to store securely in the device's storage using SecureStore.
 * @returns a Promise that resolves to a boolean indicating success or failure.
 */
export const setSecureStoreItem = async (
  key: string,
  data: string
): Promise<boolean> => {
  try {
    await SecureStore.setItemAsync(key, data);
    return true;
  } catch (err: any) {
    console.error(err);
    return false;
  }
};

/**
 * Retrieves data that matches the specified key using SecureStore.
 * @param {string} key - a string that represents the key used to access the data in the keychain.
 * @returns a Promise that resolves to a boolean indicating success or failure.
 */
export const getSecureStoreItem = async (
  key: string
): Promise<string | null> => {
  try {
    const dataStr = await SecureStore.getItemAsync(key);
    return dataStr;
  } catch (err: any) {
    console.error(err);
    return null;
  }
};

/**
 * Removes data that matches the specified key using SecureStore.
 * @param {string} key - a string that represents the key used to access the data in the keychain.
 * @returns a Promise that resolves to a boolean indicating success or failure.
 */
export const deleteSecureStoreItem = async (key: string): Promise<boolean> => {
  try {
    await SecureStore.deleteItemAsync(key);
    return true;
  } catch (err: any) {
    console.error(err);
    return false;
  }
};

// /** Keychain */

// /**
//  * Stores data in keystore using biometric authentication.
//  * @param {string} key - a key string that represents the identifier or name for the
//  * data being stored in keystore.
//  * @param {string} data - the data string that you want to securely store in keystore.
//  * @returns a Promise that resolves to a boolean indicating success or failure.
//  */
// export const setKeychainData = async (
//   key: string,
//   data: string
// ): Promise<boolean> => {
//   try {
//     await Keychain.setGenericPassword('encryptionKey', data, {
//       service: key,
//       accessControl: Keychain.ACCESS_CONTROL.DEVICE_PASSCODE, // only needed for biometrics
//       storage: Keychain.STORAGE_TYPE.AES_GCM,
//       accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
//       // securityLevel: Keychain.SECURITY_LEVEL.SECURE_SOFTWARE, // compatibility with emulators (which lack hardware security modules).
//     });
//     return true;
//   } catch (err: any) {
//     console.error(err);
//     return false;
//   }
// };

// /**
//  * Retrieves data that matches the specified key.
//  * @param {string} key - a string that represents the key used to access the data in keystore.
//  * @returns a Promise that resolves to a boolean indicating success or failure.
//  */
// export const getKeychainData = async (key: string): Promise<string | null> => {
//   try {
//     const data = await Keychain.getGenericPassword({ service: key });
//     if (!data) return null;
//     return data.password;
//   } catch (err: any) {
//     console.error(err);
//     return null;
//   }
// };

// /**
//  * Removes data that matches the specified key.
//  * @param {string} key - a string that represents the key used to access the data in keystore.
//  * @returns a Promise that resolves to a boolean indicating success or failure.
//  */
// export const resetKeychainData = async (key: string): Promise<boolean> => {
//   try {
//     await Keychain.resetGenericPassword({ service: key });
//     return true;
//   } catch (err: any) {
//     console.error(err);
//     return false;
//   }
// };
