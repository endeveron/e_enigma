import { View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Text } from '@/components/Text';

type ScreenNotificationProps = {
  message: string;
  delay?: number;
};

const ScreenNotification = ({ message, delay }: ScreenNotificationProps) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (delay) {
      const timerId = setTimeout(() => setShowContent(true), delay);
      return () => {
        timerId && clearTimeout(timerId);
      };
    }

    setShowContent(true);
  }, [delay]);

  return (
    showContent && (
      <View className="flex-row justify-center py-20">
        <Text colorName="muted" className="text-lg font-pregular">
          {message}
        </Text>
      </View>
    )
  );
};

export default ScreenNotification;
