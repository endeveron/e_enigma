import FeatherIcon from '@expo/vector-icons/Feather';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/Text';
import { useThemeColor } from '@/hooks/useThemeColor';
import { UserItem } from '@/types/chat';

type Props = {
  data: UserItem;
  onAccept: () => void;
  onReject: () => void;
};

const InvitationItem = ({ data, onAccept, onReject }: Props) => {
  const cardColor = useThemeColor('card');
  const cardAccentColor = useThemeColor('cardAccent');
  const mutedColor = useThemeColor('muted');

  const avatarLetter = data.name.at(0)?.toUpperCase();

  return (
    <View className="flex-row items-center justify-between gap-2 pl-4 pr-2 py-2">
      {/* Avatar */}
      <View
        className="flex-col w-16 h-16 items-center justify-center rounded-full"
        style={{ backgroundColor: cardAccentColor }}
      >
        <Text className="text-2xl font-pbold">{avatarLetter}</Text>
      </View>

      {/* User name */}
      <View className="flex-1 ml-2">
        <Text colorName="title" className="text-xl font-pbold">
          {data.name}
        </Text>
      </View>

      <TouchableOpacity
        className="h-14 w-14 ml-2 rounded-full flex-row items-center justify-center transition-opacity"
        style={{ backgroundColor: cardColor }}
        onPress={onAccept}
      >
        <FeatherIcon size={24} name="check" color={mutedColor} />
      </TouchableOpacity>

      <TouchableOpacity
        className="h-14 w-14 ml-2 rounded-full flex-row items-center justify-center transition-opacity"
        style={{ backgroundColor: cardColor }}
        onPress={onReject}
      >
        <FeatherIcon size={24} name="x" color={mutedColor} />
      </TouchableOpacity>
    </View>
  );
};

export default InvitationItem;
