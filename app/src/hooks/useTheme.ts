import { defaultTheme } from '@/constants/colors';
import { useColorScheme as useColorSchemeReactNative } from 'react-native';

export function useTheme() {
  const theme = useColorSchemeReactNative() ?? defaultTheme;
  return theme;
}
