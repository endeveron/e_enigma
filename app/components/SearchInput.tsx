import FeatherIcon from '@expo/vector-icons/Feather';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

import { useThemeColor } from '@/core/hooks/useThemeColor';

export type SearchInputProps = {
  onSearch: (value: string) => void;
  placeholder?: string;
};

const SearchInput = ({ onSearch, placeholder }: SearchInputProps) => {
  const [value, setValue] = useState('admin@dev.com');

  const textColor = useThemeColor('text');
  const accentColor = useThemeColor('accent');
  const mutedColor = useThemeColor('muted');

  const handleSearch = () => {
    if (!value.trim()) return;
    onSearch(value);
    setValue('');
  };

  return (
    <View className="relative flex-row items-center justify-between pr-24 pl-5 mt-14">
      <TextInput
        className="h-16 w-full font-pmedium text-xl"
        style={{ color: textColor }}
        value={value}
        placeholder={placeholder || 'Find something...'}
        placeholderTextColor={mutedColor}
        onChangeText={setValue}
        textAlignVertical="center"
        onSubmitEditing={handleSearch}
        autoFocus={true}
      />
      {value && (
        <View className="flex-row absolute right-4 items-center gap-6">
          <TouchableOpacity
            className="h-16 w-6 flex-row items-center justify-center animate-fade-in mb-1"
            onPress={handleSearch}
          >
            <FeatherIcon size={24} name="search" color={accentColor} />
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
