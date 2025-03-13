import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { Button } from '@/components/Button';
import ResetPswdStep1 from '@/components/reset-password/ResetPswdStep1';
import ResetPswdStep2 from '@/components/reset-password/ResetPswdStep2';
import { Text } from '@/components/Text';
import { wait } from '@/functions/helpers';
import { useThemeColor } from '@/hooks/useThemeColor';
import { postForgotPassword, postResetPassword } from '@/services/auth';

type Notification = {
  title: string;
  message: string;
};

const contentMap = new Map([
  [
    1,
    {
      title: `Reset Password`,
      subtitle: `A reset code will be sent to you`,
    },
  ],
  [
    2,
    {
      title: `Set Password`,
      subtitle: `Enter the code you've received`,
    },
  ],
]);

const ResetPassword = () => {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [content, setContent] = useState({
    title: '',
    subtitle: '',
  });
  const [notification, setNotification] = useState<Notification | null>(null);
  const [errorNotification, setErrorNotification] =
    useState<Notification | null>(null);

  const timerId = useRef<NodeJS.Timeout | null>(null);
  const defaultErrNotification = {
    title: `Oops!`,
    message: `Plot twist: tech malfunction. Let's try this again later`,
  };

  // const mutedColor = useThemeColor('muted');
  const backgroundColor = useThemeColor('background');

  // const handlePrevStep = () => {
  //   const prevStep = step - 1;
  //   const prevContent = contentMap.get(prevStep)!;
  //   setStep(prevStep);
  //   setContent(prevContent);
  // };

  const handleNextStep = () => {
    setNotification(null);

    // Leave the screen if it was the final step
    if (step === contentMap.size) leaveScreen();

    const nextStep = step + 1;
    const nextContent = contentMap.get(nextStep)!;
    setStep(nextStep);
    setContent(nextContent);
  };

  const leaveScreen = () => {
    router.replace('/sign-in');
  };

  const executeWithNotification = async (
    notification: Notification & { duration?: number },
    cb: () => Promise<Notification | null>
  ) => {
    const notificationDuration = notification.duration ?? 4;
    const startTs = Date.now();

    // Activate notification
    setNotification(notification);

    // Set timeout to show the notification at least
    // for 'notificationDuration' seconds
    timerId.current = setTimeout(async () => {
      // Run base logic
      const errNotification = await cb();

      // Check time difference to adhere to notificationDuration
      const timeDifInSeconds = Math.floor((Date.now() - startTs) / 1000);
      if (timeDifInSeconds < notificationDuration) {
        // Time difference is less than notificationDuration
        await wait((notificationDuration - timeDifInSeconds) * 1000);
        if (errNotification) {
          setErrorNotification(errNotification);
          return;
        }
        handleNextStep();
      } else {
        if (errNotification) {
          setErrorNotification(errNotification);
          return;
        }
        // Can move on to the next step
        handleNextStep();
      }
    }, notificationDuration);
  };

  const handleStep1Submit = async (email: string) => {
    await executeWithNotification(
      {
        title: 'Sending Code',
        message: 'Please check your email',
        duration: 5,
      },
      async () => {
        try {
          const res = await postForgotPassword({ email });
          if (res?.error) {
            return {
              title: defaultErrNotification.title,
              message: res.error.message,
            };
          }
          // Email sent
          return null;
        } catch (err: any) {
          console.error(`handleStep1Submit: ${err}`);
          return defaultErrNotification;
        }
      }
    );
  };

  const handleStep2Submit = async ({
    newPassword,
    resetToken,
  }: {
    newPassword: string;
    resetToken: string;
  }) => {
    await executeWithNotification(
      {
        title: `Setting Up`,
        message: `You'll be able to log in shortly`,
        duration: 5,
      },
      async () => {
        try {
          const res = await postResetPassword({ newPassword, resetToken });
          if (res?.error) {
            return {
              title: defaultErrNotification.title,
              message: res.error.message,
            };
          }
          return null;
        } catch (err: any) {
          console.error(`handleStep2Submit: ${err}`);
          return defaultErrNotification;
        }
      }
    );
  };

  useEffect(() => {
    const initialContent = contentMap.get(1)!;
    setContent(initialContent);

    // Clear the timeout
    return () => {
      if (timerId.current) {
        clearTimeout(timerId.current);
      }
    };
  }, []);

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
    >
      <View className="relative py-20 px-4">
        {errorNotification ? (
          <View
            className="absolute flex-1 inset-x-0 inset-y-0 flex-col items-center justify-center gap-4 z-20 px-8"
            style={{ backgroundColor }}
          >
            <Text colorName="title" className="text-4xl font-pbold">
              {errorNotification.title}
            </Text>
            <Text colorName="muted" className="text-lg font-psemibold">
              {errorNotification.message}
            </Text>
            <Button
              title="Got it"
              // variant="secondary"
              handlePress={() => leaveScreen()}
              containerClassName="mt-8"
            />
          </View>
        ) : null}
        {notification ? (
          <View
            className="absolute flex-1 inset-x-0 inset-y-0 flex-col items-center justify-center gap-4 z-10 px-8"
            style={{ backgroundColor }}
          >
            <Text colorName="title" className="text-4xl font-pbold">
              {notification.title}
            </Text>
            <Text colorName="muted" className="text-lg font-psemibold">
              {notification.message}
            </Text>
          </View>
        ) : null}

        <View className="relative flex-col items-center">
          <Image
            style={{ height: 128, width: 128 }}
            source={require('@/assets/images/logo.svg')}
            // transition={250}
          />
          <Text colorName="title" className="text-4xl font-pbold my-3">
            {content.title}
          </Text>
          <Text colorName="muted" className="font-psemibold">
            {content.subtitle}
          </Text>

          {step === 1 ? <ResetPswdStep1 onSubmit={handleStep1Submit} /> : null}
          {step === 2 ? <ResetPswdStep2 onSubmit={handleStep2Submit} /> : null}
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
};

export default ResetPassword;
