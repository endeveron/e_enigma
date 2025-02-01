import FeatherIcon from '@expo/vector-icons/Feather';
import FontAwesomeIcon from '@expo/vector-icons/FontAwesome';
import { useState } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';

import { useThemeColor } from '@/core/hooks/useThemeColor';

type Props = {
  onSubmit: (value: string) => void;
  placeholder?: string;
};

const MessageInput = ({ onSubmit, placeholder }: Props) => {
  const [value, setValue] = useState('');

  const textColor = useThemeColor('text');
  const accentBackgroundColor = useThemeColor('accentBackground');
  const mutedColor = useThemeColor('muted');

  const clearTextInput = () => {
    setValue('');
  };

  const handleSubmitTextInput = () => {
    onSubmit(value);
    clearTextInput();
  };

  return (
    <View className="relative flex-row items-center justify-between pr-24 pl-5">
      <TextInput
        className="h-16 w-full font-pmedium text-xl mb-2"
        style={{ color: textColor }}
        value={value}
        placeholder={placeholder ?? 'Type a message...'}
        placeholderTextColor={mutedColor}
        onChangeText={setValue}
        textAlignVertical="center"
        onSubmitEditing={handleSubmitTextInput}
        // autoFocus={true}
      />
      {value && (
        <View className="flex-row absolute right-2 bottom-2 items-center gap-8">
          <TouchableOpacity
            className="h-16 w-6 flex-row items-center justify-center animate-fade-in"
            onPress={handleSubmitTextInput}
          >
            <FontAwesomeIcon
              size={18}
              name="send"
              color={accentBackgroundColor}
            />
          </TouchableOpacity>
          <TouchableOpacity
            className="h-16 w-6 flex-row items-center justify-center animate-fade-in"
            onPress={clearTextInput}
          >
            <FeatherIcon size={24} name="x" color={mutedColor} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default MessageInput;
