import { defaultTheme } from '@/core/constants/colors';
import { useColorScheme as useColorSchemeReactNative } from 'react-native';

export function useTheme() {
  const theme = useColorSchemeReactNative() ?? defaultTheme;
  return theme;
}
