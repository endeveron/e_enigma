import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useEffect } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { Text } from '@/components/Text';
import {
  AUTH_EMAIL,
  AUTH_PASSWORD,
  DEFAULT_REDIRECT_URL,
} from '@/core/constants';
import { useSession } from '@/core/context/SessionProvider';
import { logMessage } from '@/core/functions/helpers';
import { useToast } from '@/core/hooks/useToast';
import { SignInFormData, signInSchema } from '@/core/utils/validation';

import { KEY_DATA_FETCHED, KEY_USER_ID_LIST } from '@/core/constants/store';
import {
  createInvitationTable,
  createLogTable,
  createMessageTable,
  createRoomMemberTable,
  createRoomTable,
  deleteAllTables,
} from '@/core/functions/db';
import {
  deleteSecureStoreItem,
  deleteStorageItem,
  getSecureStoreItem,
  setSecureStoreItem,
} from '@/core/functions/store';
import { reset } from '@/core/services/chat';

const SignIn = () => {
  const { isLoading, signIn } = useSession();
  const { showToast } = useToast();
  const { control, handleSubmit, setValue } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  // fill out the form
  useEffect(() => {
    setValue('email', AUTH_EMAIL);
    setValue('password', AUTH_PASSWORD);
  }, []);

  const onSubmit: SubmitHandler<SignInFormData> = async (
    data: SignInFormData
  ) => {
    // signOut();
    try {
      const loggedIn = await signIn({
        email: data.email,
        password: data.password,
      });
      if (loggedIn) {
        logMessage('[ AUT ] Signed in', 'success');
        router.replace(DEFAULT_REDIRECT_URL);
      }
    } catch (error: any) {
      console.error(`SignIn: ${error}`);
      showToast('Unable to login');
      logMessage(
        `[ AUT ] Sign in error: ${error.message || JSON.stringify(error)}`,
        'error'
      );
    }
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

  // const runDev = async () => {
  //   try {
  //   } catch (err: any) {
  //     console.error(err);
  //   }
  // };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
    >
      <View className="pt-20 p-4">
        <Text colorName="accent" className="text-3xl font-pbold text-center">
          Log In
        </Text>
        <Text colorName="muted" className="font-psemibold text-center mt-4">
          Welcome back
        </Text>
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
              containerClassName="mt-8"
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
          containerClassName="mt-8"
          isLoading={isLoading}
        />
        <View className="flex flex-row items-end justify-center py-8">
          <Text colorName="muted" className="font-pmedium py-4">
            Don't have an account?
          </Text>
          <Link href="/sign-up" className="ml-2 p-4">
            <Text colorName="accent" className="font-pmedium text-lg">
              Sign Up
            </Text>
          </Link>
        </View>

        <View className="flex-col items-center gap-4 mt-10">
          <Button variant="secondary" title="Reset" handlePress={resetData} />
          {/* <Button
            variant="secondary"
            title="Dev"
            handlePress={runDev}
          /> */}
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
};

export default SignIn;
