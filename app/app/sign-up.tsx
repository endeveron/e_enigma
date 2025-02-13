import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { Button } from '@/src/components/Button';
import { FormField } from '@/src/components/FormField';
import { Text } from '@/src/components/Text';
import {
  AUTH_EMAIL,
  AUTH_NAME,
  AUTH_PASSWORD,
  MAIN_REDIRECT_URL,
} from '@/src/constants';
import { useSession } from '@/src/context/SessionProvider';
import { logMessage } from '@/src/functions/helpers';
import { useToast } from '@/src/hooks/useToast';
import { SignUpFormData, signUpSchema } from '@/src/utils/validation';

const SignUp = () => {
  const router = useRouter();
  const { isLoading, signUp } = useSession();
  const { showToast } = useToast();
  const { control, handleSubmit, setValue } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  // fill out the form
  useEffect(() => {
    setValue('name', AUTH_NAME);
    setValue('email', AUTH_EMAIL);
    setValue('password', AUTH_PASSWORD);
  }, []);

  const onSubmit: SubmitHandler<SignUpFormData> = async (
    data: SignUpFormData
  ) => {
    try {
      const errorMessage = await signUp({
        name: data.name,
        email: data.email.toLowerCase(),
        password: data.password,
      });
      if (errorMessage) {
        showToast(errorMessage);
        logMessage(`[ AUT ] Unable to register: ${errorMessage}`, 'error');
        return;
      }

      // Success, redirect to MAIN_REDIRECT_URL
      logMessage('[ AUT ] Signed up');
      router.replace(MAIN_REDIRECT_URL);
    } catch (error: any) {
      showToast('Something went wrong. Please try again later');
      logMessage(
        `[ AUT ] Sign up error: ${error.message || JSON.stringify(error)}`,
        'error'
      );
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
            Sign Up
          </Text>
          <Text colorName="muted" className="font-psemibold">
            {isLoading ? 'Sending data' : 'Create your account'}
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
                name="name"
                label="Name"
                value={value}
                onBlur={onBlur}
                handleChangeText={onChange}
                containerClassName="mt-4"
                error={error}
                // autoFocus={true}
              />
            )}
            name="name"
          />

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
            title="Sign Up"
            handlePress={handleSubmit(onSubmit)}
            containerClassName="mt-8 w-full"
            isLoading={isLoading}
          />

          <View className="flex flex-col items-center justify-center py-8">
            <Link
              href="/sign-in"
              className="flex flex-row items-end justify-center p-4"
            >
              <Text colorName="muted" className="font-pmedium">
                Have an account ?
              </Text>
              <View className="w-4"></View>
              <Text
                colorName={isLoading ? 'muted' : 'link'}
                className="font-pmedium text-lg"
              >
                Log In
              </Text>
            </Link>
          </View>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
};

export default SignUp;
