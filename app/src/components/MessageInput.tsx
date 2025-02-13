import FontAwesomeIcon from '@expo/vector-icons/FontAwesome';
import { useState } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';

import { useThemeColor } from '@/src/hooks/useThemeColor';

type Props = {
  onSubmit: (value: string) => void;
  placeholder?: string;
};

const MessageInput = ({ onSubmit, placeholder }: Props) => {
  const [value, setValue] = useState('');

  const textColor = useThemeColor('text');
  const cardColor = useThemeColor('card');
  const inactiveColor = useThemeColor('inactive');

  const clearTextInput = () => {
    setValue('');
  };

  const handleSubmitTextInput = () => {
    onSubmit(value);
    clearTextInput();
  };

  return (
    <View
      className="h-16 relative flex-row items-center justify-between pr-14 pl-4"
      style={{ backgroundColor: cardColor }}
    >
      <TextInput
        className="h-16 w-full font-psemibold"
        style={{ color: textColor, fontSize: 18 }}
        value={value}
        placeholder={placeholder ?? 'Share your thoughts...'}
        placeholderTextColor={inactiveColor}
        onChangeText={setValue}
        textAlignVertical="center"
        onSubmitEditing={handleSubmitTextInput}
        // autoFocus={true}
      />
      {!!value ? (
        <View className="flex-row absolute right-4 items-center gap-8">
          <TouchableOpacity
            className="h-16 w-6 flex-row items-center justify-center"
            onPress={handleSubmitTextInput}
          >
            <FontAwesomeIcon size={18} name="send" color={textColor} />
          </TouchableOpacity>
          {/* <TouchableOpacity
            className="h-16 w-6 flex-row items-center justify-center"
            onPress={clearTextInput}
          >
            <FeatherIcon size={24} name="x" color={mutedColor} />
          </TouchableOpacity> */}
        </View>
      ) : null}
    </View>
  );
};

export default MessageInput;
