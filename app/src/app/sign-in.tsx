import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { Text } from '@/components/Text';
import { AUTH_EMAIL, AUTH_PASSWORD, MAIN_REDIRECT_URL } from '@/constants';
import { KEY_DATA_FETCHED, KEY_USER_ID_LIST } from '@/constants/store';
import { useSession } from '@/context/SessionProvider';
import {
  createInvitationTable,
  createLogTable,
  createMessageTable,
  createRoomMemberTable,
  createRoomTable,
  deleteAllTables,
} from '@/functions/db';
import { logMessage } from '@/functions/helpers';
import {
  deleteSecureStoreItem,
  deleteStorageItem,
  getSecureStoreItem,
  setSecureStoreItem,
} from '@/functions/store';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useToast } from '@/hooks/useToast';
import { reset } from '@/services/chat';
import { SignInFormData, signInSchema } from '@/utils/validation';

const SignIn = () => {
  const { isLoading, signIn } = useSession();
  const { showToast } = useToast();
  const { control, handleSubmit, setValue } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const [isDevMode, setIsDevMode] = useState(false);

  const cardColor = useThemeColor('card');

  // fill out the form
  useEffect(() => {
    setValue('email', AUTH_EMAIL);
    setValue('password', AUTH_PASSWORD);
  }, []);

  const onSubmit: SubmitHandler<SignInFormData> = async (
    data: SignInFormData
  ) => {
    try {
      const errorMessage = await signIn({
        email: data.email.toLowerCase(),
        password: data.password,
      });
      if (errorMessage) {
        showToast(errorMessage);
        logMessage(`[ AUT ] Unable to login: ${errorMessage}`, 'error');
        return;
      }

      // Success, redirect to MAIN_REDIRECT_URL
      logMessage('[ AUT ] Logged in', 'success');
      router.replace(MAIN_REDIRECT_URL);
    } catch (error: any) {
      showToast('Something went wrong. Please try again later');
      logMessage(
        `[ AUT ] Sign in error: ${error.message || JSON.stringify(error)}`,
        'error'
      );
    }
  };

  const handleToggleDevMode = () => {
    setIsDevMode((prev) => !prev);
  };

  const resetData = async () => {
    try {
      // Remote db: users, rooms, messages
      const remoteDbSuccess = await reset();
      if (!remoteDbSuccess) return;
      logMessage(`[ SIS ] Cleared all collections in remote db`);

      // Local db tables
      const deleteSuccess = await deleteAllTables();
      const logTableSuccess = await createLogTable();
      const roomTableSuccess = await createRoomTable();
      const roomMemberTableSuccess = await createRoomMemberTable();
      const messageTableSuccess = await createMessageTable();
      const invSentTableSuccess = await createInvitationTable('sent');
      const invRecievedTableSuccess = await createInvitationTable('recieved');

      // MMKV storage items
      deleteStorageItem(KEY_DATA_FETCHED);

      // Shared keys in SecureStore
      let error = false;
      const userIdListStr = await getSecureStoreItem(KEY_USER_ID_LIST);
      if (userIdListStr) {
        const userIdList: string[] = userIdListStr.split(',');
        for (let userId of userIdList) {
          if (userId) {
            await deleteSecureStoreItem(`shared_${userId}`);
            const keyExists = await getSecureStoreItem(`shared_${userId}`);
            if (!keyExists)
              logMessage(`[ SIS ] Deleted shared key for user ${userId}`);
            else {
              error = true;
            }
          }
        }
        if (!error) {
          await setSecureStoreItem(KEY_USER_ID_LIST, '');
          logMessage(`[ SIS ] User id list is clean`);
        }
      }

      if (
        deleteSuccess &&
        logTableSuccess &&
        roomTableSuccess &&
        roomMemberTableSuccess &&
        messageTableSuccess &&
        invSentTableSuccess &&
        invRecievedTableSuccess
      ) {
        showToast('Data reset');
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
    >
      <View className="py-20 px-4">
        <View className="flex-col items-center">
          <Image
            style={{ height: 128, width: 128 }}
            source={require('@/assets/images/logo.svg')}
            // transition={250}
          />
          <Text colorName="title" className="text-4xl font-pbold my-3">
            Log In
          </Text>

          <Text
            onPress={handleToggleDevMode}
            colorName="muted"
            className="font-psemibold"
          >
            {isLoading ? 'Sending data' : 'Welcome back'}
          </Text>
        </View>

        <View
          className={`flex-col items-center ${
            isLoading ? 'opacity-40 pointer-events-none' : ''
          }`}
        >
          <Controller
            control={control}
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <FormField
                name="email"
                label="Email"
                value={value}
                onBlur={onBlur}
                handleChangeText={onChange}
                containerClassName="mt-4"
                error={error}
                keyboardType="email-address"
                // autoFocus={true}
              />
            )}
            name="email"
          />
          <Controller
            control={control}
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <FormField
                name="password"
                label="Password"
                value={value}
                onBlur={onBlur}
                handleChangeText={onChange}
                containerClassName="mt-4"
                error={error}
              />
            )}
            name="password"
          />

          <Button
            title="Log In"
            handlePress={handleSubmit(onSubmit)}
            containerClassName="mt-8 w-full"
            isLoading={isLoading}
          />
          <View className="flex flex-col items-center justify-center py-8">
            <Link
              href="/sign-up"
              className="flex flex-row items-end justify-center p-4"
            >
              <Text colorName="muted" className="font-pmedium">
                Don't have an account?
              </Text>
              <View className="w-4"></View>
              <Text
                colorName={isLoading ? 'muted' : 'link'}
                className="font-pmedium text-lg"
              >
                Sign Up
              </Text>
            </Link>

            <Link
              href="/reset-password"
              className="flex flex-row items-end justify-center p-4"
            >
              <Text colorName="muted" className="font-pmedium">
                Forgot password?
              </Text>
            </Link>
          </View>
        </View>

        {/* Dev mode */}
        {isDevMode ? (
          <View className="flex-row justify-center gap-8">
            <TouchableOpacity
              className="px-8 py-4 rounded-full"
              onPress={resetData}
              style={{ backgroundColor: cardColor }}
            >
              <Text colorName="muted" className="font-pmedium">
                Reset
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </KeyboardAwareScrollView>
  );
};

export default SignIn;
