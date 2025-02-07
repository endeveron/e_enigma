import { useThemeColor } from '@/core/hooks/useThemeColor';
import { ReactElement } from 'react';

import { Text, TouchableOpacity, View } from 'react-native';

export const Button = ({
  title,
  handlePress,
  variant = 'primary',
  containerClassName,
  textClassName,
  isLoading,
  icon,
}: {
  title: string;
  handlePress: () => void;
  variant?: 'primary' | 'secondary' | 'brand';
  containerClassName?: string;
  textClassName?: string;
  isLoading?: boolean;
  icon?: ReactElement;
}) => {
  const btnPrimaryText = useThemeColor('btnPrimaryText');
  const btnPrimaryBg = useThemeColor('btnPrimaryBg');
  const btnSecondaryText = useThemeColor('btnSecondaryText');
  const btnSecondaryBg = useThemeColor('btnSecondaryBg');
  // const btnBrandText = useThemeColor('btnBrandText');
  // const btnBrandBg = useThemeColor('brand');

  const containerOpacity = isLoading ? 'opacity-50' : '';
  let textStyle = { color: btnPrimaryText };
  let bgStyle = { backgroundColor: btnPrimaryBg };

  switch (variant) {
    // case 'brand':
    //   {
    //     textStyle = { color: btnBrandText };
    //     bgStyle = { backgroundColor: btnBrandBg };
    //   }
    //   break;
    case 'secondary': {
      textStyle = { color: btnSecondaryText };
      bgStyle = { backgroundColor: btnSecondaryBg };
    }
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      className={`relative overflow-hidden rounded-full min-h-14 flex flex-row justify-center items-center px-8 transition-opacity ${containerClassName} ${containerOpacity}`}
      disabled={isLoading}
    >
      {icon ? <View className="relative z-10 -ml-1 mr-2">{icon}</View> : null}
      <Text
        style={textStyle}
        className={`relative z-10 text-xl font-psemibold ${textClassName}`}
      >
        {title}
      </Text>
      <View style={bgStyle} className="absolute inset-x-0 inset-y-0 z-0"></View>
    </TouchableOpacity>
  );
};
