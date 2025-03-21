import { useFonts } from 'expo-font';
import { Slot, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';

import { StatusBar } from '@/components/StatusBar';
import { colors } from '@/constants/colors';
import EventProvider from '@/context/EventProvider';
import LocalDBProvider from '@/context/LocalDBProvider';
import SessionProvider from '@/context/SessionProvider';
import { useTheme } from '@/hooks/useTheme';

import '@/styles/global.css';

configureReanimatedLogger({
  level: ReanimatedLogLevel.error,
  strict: false,
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Set the animation options. Doesn't work in Expo Go
SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

export default function RootLayout() {
  const theme = useTheme();
  const [loaded] = useFonts({
    // Paragraph
    'NotoSans-Thin': require('../assets/fonts/NotoSans-Thin.ttf'), // 100
    'NotoSans-ExtraLight': require('../assets/fonts/NotoSans-ExtraLight.ttf'), // 200
    'NotoSans-Light': require('../assets/fonts/NotoSans-Light.ttf'), // 300
    'NotoSans-Regular': require('../assets/fonts/NotoSans-Regular.ttf'), // 400
    'NotoSans-Medium': require('../assets/fonts/NotoSans-Medium.ttf'), // 500
    'NotoSans-SemiBold': require('../assets/fonts/NotoSans-SemiBold.ttf'), // 600
    'NotoSans-Bold': require('../assets/fonts/NotoSans-Bold.ttf'), // 700
    'NotoSans-ExtraBold': require('../assets/fonts/NotoSans-ExtraBold.ttf'), // 800
    'NotoSans-Black': require('../assets/fonts/NotoSans-Black.ttf'), // 900
  });

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // Forcing dark mode by overriding system-wide theme settings (if applicable)
        Appearance.setColorScheme('dark');

        // Change the root view background color
        await SystemUI.setBackgroundColorAsync(colors[theme].background);

        // App is ready, hide splash screen
        await SplashScreen.hideAsync();
      } catch (err: any) {
        console.error(err);
      }
    };

    loaded && prepareApp();
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <LocalDBProvider>
          <EventProvider>
            <SessionProvider>
              <Slot />
              <StatusBar style={'light'} />
            </SessionProvider>
          </EventProvider>
        </LocalDBProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
