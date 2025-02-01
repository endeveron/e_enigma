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
  AUTH_NAME,
  AUTH_EMAIL,
  AUTH_PASSWORD,
  DEFAULT_REDIRECT_URL,
} from '@/core/constants';
import { useSession } from '@/core/context/SessionProvider';
import { logMessage } from '@/core/functions/helpers';
import { useToast } from '@/core/hooks/useToast';
import { signUpSchema, SignUpFormData } from '@/core/utils/validation';

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
      const registered = await signUp({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      if (registered) {
        logMessage('[ AUT ] Signed up');
        router.replace(DEFAULT_REDIRECT_URL);
      }
    } catch (error: any) {
      showToast('Unable to register');
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
      <View className="pt-20 p-4">
        <Text colorName="accent" className="text-3xl font-pbold text-center">
          Sign Up
        </Text>
        <Text colorName="muted" className="font-psemibold text-center mt-4">
          Create your account
        </Text>
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
        <View className="flex flex-row items-end justify-center py-8">
          <Text colorName="muted" className="font-pmedium py-4">
            Have an account ?
          </Text>
          <Link href="/sign-in" className="ml-2 p-4">
            <Text colorName="accent" className="font-pmedium text-lg">
              Log In
            </Text>
          </Link>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
};

export default SignUp;
