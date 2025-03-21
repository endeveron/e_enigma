import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { useThemeColor } from '@/hooks/useThemeColor';
import { InvitatoionMapItem, UserItemExt } from '@/types/chat';
import { View } from 'react-native';

type Props = {
  data: UserItemExt;
  sentInvitationMap: Map<string, InvitatoionMapItem>;
  onPress: (data: UserItemExt) => void;
};

const UserItem = ({ data, sentInvitationMap, onPress }: Props) => {
  const cardColor = useThemeColor('card');
  const avatarLetter = data.name.at(0)?.toUpperCase();
  const isInvited = sentInvitationMap.has(data.id);
  const canInvite = data.isInvite && !isInvited;

  return (
    <View className="flex-row items-center justify-between gap-4 px-4 py-2 ">
      {/* Avatar */}
      <View
        className="flex-col w-16 h-16 items-center justify-center rounded-full"
        style={{ backgroundColor: cardColor }}
      >
        <Text className="text-2xl font-pbold">{avatarLetter}</Text>
      </View>

      {/* User name */}
      <View className="flex-1">
        <Text colorName="title" className="text-xl font-pbold">
          {data.name}
        </Text>
      </View>

      {isInvited ? (
        <Text colorName="muted" className="font-psemibold text-lg">
          invitation sent
        </Text>
      ) : null}

      {canInvite ? (
        <Button
          title="Invite"
          handlePress={() => onPress(data)}
          // variant="secondary"
        />
      ) : null}
    </View>
  );
};

export default UserItem;
