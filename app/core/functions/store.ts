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
 * Stores an item with the provided key and value '1' to the MMKV storage.
 */
export const setStorageItem = (key: string): void => {
  storage.set(key, '1');
};

/**
 * Removes the item with the provided keyfrom the MMKV storage.
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
//  * Stores data in the keychain using biometric authentication.
//  * @param {string} key - a string that represents the identifier or name for the
//  * data being stored in the keychain. It is used to uniquely identify the data associated with it.
//  * @param {string} data - the data string that you want to securely store in the keychain.
//  * @returns a Promise that resolves to a boolean indicating success or failure.
//  */
// export const setKeychainData = async (
//   key: string,
//   data: string
// ): Promise<boolean> => {
//   try {
//     await Keychain.setGenericPassword(key, data, {
//       accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
//       accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
//       storage: Keychain.STORAGE_TYPE.AES_GCM,
//     });
//     return true;
//   } catch (err: any) {
//     console.error(err);
//     return false;
//   }
// };

// /**
//  * Retrieves data that matches the specified key.
//  * @param {string} key - a string that represents the key used to access the data in the keychain.
//  * @returns a Promise that resolves to a boolean indicating success or failure.
//  */
// export const getKeychainData = async (key: string): Promise<string | null> => {
//   try {
//     const data = await Keychain.getGenericPassword(key);
//     if (!data) return null;
//     return data.password;
//   } catch (err: any) {
//     console.error(err);
//     return null;
//   }
// };

// /**
//  * Removes data that matches the specified key.
//  * @param {string} key - a string that represents the key used to access the data in the keychain.
//  * @returns a Promise that resolves to a boolean indicating success or failure.
//  */
// export const resetKeychainData = async (key: string): Promise<boolean> => {
//   try {
//     await Keychain.getGenericPassword(key);
//     return true;
//   } catch (err: any) {
//     console.error(err);
//     return false;
//   }
// };
