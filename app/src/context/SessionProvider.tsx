import { router } from 'expo-router';
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';

import { MAIN_REDIRECT_URL } from '@/constants';
import {
  getSecureStoreItem,
  setSecureStoreItem,
  deleteSecureStoreItem,
} from '@/functions/store';
import { useToast } from '@/hooks/useToast';
import { postSignIn, postSignUp } from '@/services/auth';
import {
  AuthCredentials,
  AuthSession,
  EncryptionKeypair,
  SessionContext as TSessionContext,
  UserAuthData,
} from '@/types/auth';
import { logMessage } from '@/functions/helpers';
import { generateEncryptionKeys } from '@/functions/encryption';
import {
  KEY_AUTH_DATA,
  KEY_PUBLIC_KEY,
  KEY_SECRET_KEY,
  KEY_USER_ID_LIST,
} from '@/constants/store';

type EncryptionKeys = {
  publicKeyBase64: string;
  secretKeyBase64: string;
};

const SessionContext = createContext<TSessionContext>({
  session: null,
  isLoading: false,
  signUp: async (args: AuthCredentials) => null,
  signIn: async (args: AuthCredentials) => null,
  signOut: async () => {},
});

export const useSession = () => {
  const value = useContext(SessionContext);
  if (process.env.NODE_ENV !== 'production') {
    if (!value) {
      throw new Error('useSession must be wrapped in a <SessionProvider />');
    }
  }
  return value;
};

const SessionProvider = ({ children }: PropsWithChildren) => {
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<AuthSession>(null);

  const signOut = async () => {
    try {
      // Reset auth data from store
      const success = await deleteSecureStoreItem(KEY_AUTH_DATA);
      if (!success) {
        logMessage(`[ AUT ] Unable to delete auth data from store`, 'error');
        return;
      }
      logMessage('[ AUT ] Auth data removed from store', 'success');

      // reset auth session
      setSession(null);
      logMessage('[ AUT ] Sign out');
      router.replace('/sign-in');
    } catch (error: any) {
      // showToast('Unable to sign out');
      logMessage(`[ AUT ] Unable to clear data. ${error.message}`, 'error');
    }
  };

  /** Updates session, saves auth data in SecureStore. */
  const saveAuthData = async ({
    token,
    user,
  }: UserAuthData): Promise<boolean> => {
    // Update session
    setSession({ token, user });

    // Save auth data in SecureStore
    const authDataStr = JSON.stringify({
      token,
      user,
      timestamp: Date.now(),
    });
    const success = await setSecureStoreItem(KEY_AUTH_DATA, authDataStr);
    if (!success) showToast('Unable to save auth data in store');
    return success;
  };

  const saveKeysInSecureStore = async ({
    publicKeyBase64,
    secretKeyBase64,
  }: EncryptionKeys) => {
    const publicSuccess = await setSecureStoreItem(
      KEY_PUBLIC_KEY,
      publicKeyBase64
    );
    if (!publicSuccess) {
      logMessage('[ AUT ] Unable to save public key in secure store', 'error');
    }
    const secretSuccess = await setSecureStoreItem(
      KEY_SECRET_KEY,
      secretKeyBase64
    );
    if (!secretSuccess) {
      logMessage('[ AUT ] Unable to save secret key in secure store', 'error');
    }
    if (!publicSuccess || !secretSuccess) {
      showToast('Unable to save encryption keys');
    } else {
      logMessage('[ AUT ] Keys saved in secure store', 'success');
    }
    return publicSuccess && secretSuccess;
  };

  const regenerateKeys = async (): Promise<EncryptionKeypair | null> => {
    // Generate encryption keys
    const keyPair = generateEncryptionKeys();
    if (!keyPair) {
      logMessage(
        `[ CHP ] Unable to generate encryption keys for current user`,
        'error'
      );
      return null;
    }

    // Save the keys in secure store
    const storeSuccess = await saveKeysInSecureStore(keyPair);
    if (!storeSuccess) {
      logMessage(`[ CHP ] Unable to store encryption keys`, 'error');
      return null;
    }

    return keyPair;
  };

  /** Creates the user id list item in SecureStore. */
  // const createUserIdListInSecureStore = async (userId: string) => {
  const createUserIdListInSecureStore = async () => {
    // const success = await setSecureStoreItem(KEY_USER_ID_LIST, `${userId}`);
    const success = await setSecureStoreItem(KEY_USER_ID_LIST, '');
    return success;
  };

  /** Gets auth data from SecureStore, updates auth state. */
  const restoreAuthData = async () => {
    const dataStr = await getSecureStoreItem(KEY_AUTH_DATA);
    if (!dataStr) return;
    const { timestamp: prevTimestamp, ...authData } = JSON.parse(dataStr);
    // check if the token is valid
    const currentTimestamp = Date.now();
    const tokenValidityTime = 48 * 60 * 60 * 1000; // 48h
    if (currentTimestamp - prevTimestamp < tokenValidityTime) {
      setSession(authData);
      router.push(MAIN_REDIRECT_URL);
    } else {
      signOut();
    }
  };

  // Get auth data from SecureStore
  useEffect(() => {
    restoreAuthData();
  }, []);

  const signUp = async ({
    name,
    email,
    password,
  }: AuthCredentials): Promise<string | null> => {
    const errMsg = 'Unable to register';
    try {
      setIsLoading(true);

      // Generate encryption keys
      const keyPair = generateEncryptionKeys();
      if (!keyPair) {
        setIsLoading(false);
        return 'Unable to generate keys';
      }

      // Send request to the server
      const result = await postSignUp({
        name,
        email,
        password,
        publicKey: keyPair.publicKeyBase64,
      });
      setIsLoading(false);
      if (result?.error) return result.error.message;
      if (result?.data) {
        const authSuccess = await saveAuthData(result.data);
        if (!authSuccess) return `Could not save auth data`;
        const keysSSuccess = await saveKeysInSecureStore(keyPair);
        if (!keysSSuccess) return `Could not save keys in secure store`;
        const userListSuccess = await createUserIdListInSecureStore();
        if (!userListSuccess) return `Could not save user list in secure store`;
        return null;
      }
      return errMsg;
    } catch (error: any) {
      console.error(error);
      return error.message ?? errMsg;
    }
  };

  const signIn = async ({
    email,
    password,
  }: AuthCredentials): Promise<string | null> => {
    const errMsg = 'Unable to login';
    try {
      let keyPair: EncryptionKeypair | null = null;

      setIsLoading(true);
      // Check if encryption keys are stored in secure store
      const curUserPublicKey = await getSecureStoreItem(KEY_PUBLIC_KEY);
      if (!curUserPublicKey) {
        keyPair = await regenerateKeys();
        if (!keyPair) {
          setIsLoading(false);
          return 'Unable to regenerate keys';
        }
      }

      const result = await postSignIn({
        email,
        password,
        publicKey: keyPair?.publicKeyBase64,
      });
      setIsLoading(false);

      if (result?.error) {
        return result.error.message;
      }
      if (result?.data) {
        await saveAuthData(result.data);
        return null;
      }
      return errMsg;
    } catch (error: any) {
      console.error(error);
      return error.message ?? errMsg;
    }
  };

  const value = {
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};

export default SessionProvider;
