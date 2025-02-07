import FeatherIcon from '@expo/vector-icons/Feather';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

import { useThemeColor } from '@/core/hooks/useThemeColor';

export type SearchInputProps = {
  onSearch: (value: string) => void;
  placeholder?: string;
};

const SearchInput = ({ onSearch, placeholder }: SearchInputProps) => {
  const [value, setValue] = useState('');

  const textColor = useThemeColor('text');
  const cardColor = useThemeColor('card');
  const inactiveColor = useThemeColor('inactive');

  const handleSearch = () => {
    if (!value.trim()) return;
    onSearch(value);
    setValue('');
  };

  return (
    <View
      className="h-16 relative flex-row items-center justify-between pr-14 pl-5"
      style={{ backgroundColor: cardColor }}
    >
      <TextInput
        className="h-16 w-full font-pmedium text-xl"
        style={{ color: textColor }}
        value={value}
        placeholder={placeholder || 'Find something...'}
        placeholderTextColor={inactiveColor}
        onChangeText={setValue}
        textAlignVertical="center"
        onSubmitEditing={handleSearch}
        // autoFocus={true}
      />
      {value && (
        <View className="flex-row absolute right-4 items-center gap-6">
          <TouchableOpacity
            className="h-16 w-6 flex-row items-center justify-center animate-fade-in mb-1"
            onPress={handleSearch}
          >
            <FeatherIcon size={24} name="search" color={textColor} />
          </TouchableOpacity>

          {/* <TouchableOpacity
            className="h-16 w-6 flex-row items-center justify-center animate-fade-in"
            onPress={clearInput}
          >
            <FeatherIcon size={24} name="x" color={mutedColor} />
          </TouchableOpacity> */}
        </View>
      )}
    </View>
  );
};

export default SearchInput;
