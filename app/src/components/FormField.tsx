import IonIcon from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { FieldError } from 'react-hook-form';
import {
  KeyboardTypeOptions,
  NativeSyntheticEvent,
  TextInput,
  TextInputFocusEventData,
  TouchableOpacity,
  View,
} from 'react-native';

import { FormErrorMessage } from '@/components/FormErrorMessage';
import { Text } from '@/components/Text';
import { useThemeColor } from '@/hooks/useThemeColor';

export const FormField = ({
  name,
  label,
  value,
  placeholder,
  handleChangeText,
  containerClassName,
  numberOfLines = 1,
  keyboardType,
  onBlur,
  error,
  autoFocus,
}: {
  name: string;
  value: string;
  handleChangeText: (text: string) => void;
  label?: string;
  containerClassName?: string;
  placeholder?: string;
  numberOfLines?: number;
  keyboardType?: KeyboardTypeOptions;
  onBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  error?: FieldError;
  autoFocus?: boolean;
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordField = name === 'password' || name === 'confirm';

  const textColor = useThemeColor('text');
  const redColor = useThemeColor('red');
  const mutedColor = useThemeColor('muted');
  const inactiveColor = useThemeColor('inactive');
  const cardColor = useThemeColor('card');

  const nultiline = numberOfLines > 1;
  let heightClassName = 'h-14';

  if (nultiline) {
    switch (numberOfLines) {
      case 2:
        heightClassName = 'h-16';
        break;
      default:
        heightClassName = 'h-20';
    }
  }

  return (
    <View className={`${containerClassName}`}>
      {!!label ? (
        <Text colorName="muted" className="font-pmedium mb-1">
          {label}
        </Text>
      ) : null}

      <View
        style={{
          backgroundColor: cardColor,
          borderColor: redColor,
          borderWidth: !!error ? 2 : 0,
        }}
        className={`${heightClassName} w-full px-4 border-2 rounded-lg flex flex-row items-center`}
      >
        <TextInput
          className="flex-1 font-pmedium text-xl"
          style={{ color: textColor }}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={inactiveColor}
          onChangeText={handleChangeText}
          onBlur={onBlur}
          multiline={nultiline}
          numberOfLines={numberOfLines}
          textAlignVertical={nultiline ? 'top' : 'center'}
          secureTextEntry={isPasswordField && !showPassword}
          keyboardType={keyboardType}
          autoFocus={autoFocus}
        />

        {isPasswordField ? (
          <TouchableOpacity
            className="opacity-40"
            onPress={() => setShowPassword(!showPassword)}
          >
            <IonIcon
              size={24}
              name={showPassword ? 'eye' : 'eye-off'}
              color={mutedColor}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {!!error ? <FormErrorMessage>{error.message}</FormErrorMessage> : null}
    </View>
  );
};
