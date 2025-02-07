import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { Text } from '@/components/Text';
import {
  AUTH_EMAIL,
  AUTH_NAME,
  AUTH_PASSWORD,
  DEFAULT_REDIRECT_URL,
} from '@/core/constants';
import { useSession } from '@/core/context/SessionProvider';
import { logMessage } from '@/core/functions/helpers';
import { useToast } from '@/core/hooks/useToast';
import { SignUpFormData, signUpSchema } from '@/core/utils/validation';

const SignUp = () => {
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

      // Success, redirect to DEFAULT_REDIRECT_URL
      logMessage('[ AUT ] Signed up');
      router.replace(DEFAULT_REDIRECT_URL);
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
          <Text colorName="textAlt" className="text-4xl font-pbold my-3">
            Sign Up
          </Text>
          <Text colorName="muted" className="font-psemibold">
            Create your account
          </Text>
        </View>

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
              containerClassName="mt-8"
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
          containerClassName="mt-8"
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
            <Text colorName="textAlt" className="font-pmedium text-lg ">
              Log In
            </Text>
          </Link>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
};

export default SignUp;
