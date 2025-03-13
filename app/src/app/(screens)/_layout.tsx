import { Redirect, Stack } from 'expo-router';
import React from 'react';

import { useThemeColor } from '@/hooks/useThemeColor';
import { useSession } from '@/context/SessionProvider';
import ChatProvider from '@/context/ChatProvider';
import SocketProvider from '@/context/SocketProvider';

export default function ScreensLayout() {
  const { session } = useSession();
  const background = useThemeColor('background');

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <ChatProvider>
      <SocketProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: background },
          }}
        />
      </SocketProvider>
    </ChatProvider>
  );
}
