import { ReactElement } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export const Button = ({
  title,
  handlePress,
  variant = 'primary',
  containerClassName,
  textClassName,
  isLoading,
  icon,
}: {
  title?: string;
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
      className={`relative overflow-hidden rounded-full min-h-14 flex flex-row justify-center items-center px-4 ${containerClassName}`}
      // disabled={isLoading}
    >
      {icon ? (
        <View className={`relative z-10 ${title ? 'ml-3' : ''}`}>{icon}</View>
      ) : null}
      {title ? (
        <Text
          style={textStyle}
          className={`relative z-10 text-xl font-psemibold ${
            icon ? 'ml-3 mr-4' : 'mx-4'
          } ${textClassName}`}
        >
          {isLoading ? 'Please wait' : title}
        </Text>
      ) : null}
      <View style={bgStyle} className="absolute inset-x-0 inset-y-0 z-0"></View>
    </TouchableOpacity>
  );
};
