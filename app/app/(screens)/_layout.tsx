import { Redirect, Stack } from 'expo-router';
import React from 'react';

import { useThemeColor } from '@/core/hooks/useThemeColor';
import { Screen } from '@/core/types/common';
import { useSession } from '@/core/context/SessionProvider';
import ChatProvider from '@/core/context/ChatProvider';
import SocketProvider from '@/core/context/SocketProvider';

const screens: Screen[] = [
  { name: 'index', title: 'Messenger' },
  { name: 'invitations', title: 'Invitations' },
  { name: 'room/[id]', title: 'Chat Room' },
  { name: 'search', title: 'Search' },
];

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
          }}
        >
          {screens.map((screen: Screen) => (
            <Stack.Screen
              key={screen.name}
              name={screen.name}
              options={{
                // presentation: 'modal',
                // title: screen.title,
                headerShown: false,
                contentStyle: { backgroundColor: background },
              }}
            />
          ))}
        </Stack>
      </SocketProvider>
    </ChatProvider>
  );
}
