import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Text } from '@/src/components/Text';

type ScreenNotificationProps = {
  message: string;
  delay?: number;
};

const ScreenNotification = ({ message, delay }: ScreenNotificationProps) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (delay) {
      setTimeout(() => setShowContent(true), delay);
    } else {
      setShowContent(true);
    }
  }, [delay]);

  return showContent ? (
    <View className="flex-row justify-center py-16">
      <Text colorName="inactive" className="text-lg font-pmedium">
        {message}
      </Text>
    </View>
  ) : null;
};

export default ScreenNotification;
