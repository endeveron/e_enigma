import { router } from 'expo-router';
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';

import { DEFAULT_REDIRECT_URL } from '@/core/constants';
import {
  getSecureStoreItem,
  setSecureStoreItem,
  deleteSecureStoreItem,
} from '@/core/functions/store';
import { useToast } from '@/core/hooks/useToast';
import { postSignIn, postSignUp } from '@/core/services/auth';
import {
  AuthCredentials,
  AuthSession,
  SessionContext as TSessionContext,
  UserAuthData,
} from '@/core/types/auth';
import { logMessage } from '@/core/functions/helpers';
import { generateEncryptionKeys } from '@/core/functions/encryption';
import {
  KEY_AUTH_DATA,
  KEY_PUBLIC_KEY,
  KEY_SECRET_KEY,
  KEY_USER_ID_LIST,
} from '@/core/constants/store';

const SessionContext = createContext<TSessionContext>({
  session: null,
  isLoading: false,
  signUp: async (args: AuthCredentials) => false,
  signIn: async (args: AuthCredentials) => false,
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

  /** Saves public and secret keys in SecureStore. */
  const saveKeysInSecureStore = async ({
    publicKeyBase64,
    secretKeyBase64,
  }: {
    publicKeyBase64: string;
    secretKeyBase64: string;
  }) => {
    const publicSuccess = await setSecureStoreItem(
      KEY_PUBLIC_KEY,
      publicKeyBase64
    );
    const secretSuccess = await setSecureStoreItem(
      KEY_SECRET_KEY,
      secretKeyBase64
    );
    if (!publicSuccess || !secretSuccess)
      showToast('Unable to save encryption key');
    return publicSuccess && secretSuccess;
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
      router.push(DEFAULT_REDIRECT_URL);
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
  }: AuthCredentials): Promise<boolean | undefined> => {
    try {
      setIsLoading(true);

      // Generate encryption keys
      const keyPair = generateEncryptionKeys();

      // Send request to the server
      const result = await postSignUp({
        name,
        email,
        password,
        publicKey: keyPair.publicKeyBase64,
      });
      setIsLoading(false);
      if (result?.error) {
        showToast(result.error.message);
        console.error(result.error.message);
        return false;
      }
      if (result?.data) {
        const authSuccess = await saveAuthData(result.data);
        const keysSuccess = await saveKeysInSecureStore(keyPair);
        const userListSuccess = await createUserIdListInSecureStore();
        // result.data.user.id
        return authSuccess && keysSuccess && userListSuccess;
      }
    } catch (error: any) {
      showToast(error.message);
      console.error(error.message);
      return false;
    }
  };

  const signIn = async ({
    email,
    password,
  }: AuthCredentials): Promise<boolean | undefined> => {
    try {
      setIsLoading(true);
      const result = await postSignIn({ email, password });
      setIsLoading(false);

      if (result?.error) {
        showToast(result.error.message);
        console.error(result.error.message);
        return false;
      }
      if (result?.data) {
        await saveAuthData(result.data);
        return true;
      }
    } catch (error: any) {
      showToast(error.message);
      console.error(error.message);
      return false;
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
