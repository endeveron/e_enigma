import FeatherIcon from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/Text';
import { useThemeColor } from '@/core/hooks/useThemeColor';
import { RoomMemberMapItem, RoomItem as TRoomItem } from '@/core/types/chat';
import { logMessage } from '@/core/functions/helpers';

type Props = {
  data: TRoomItem;
  roomMemberMap: Map<string, RoomMemberMapItem>;
  // onPress: (roomId: string) => void;
};

const RoomItem = ({ data, roomMemberMap }: Props) => {
  const router = useRouter();

  const cardAltColor = useThemeColor('cardAlt');
  const textAltColor = useThemeColor('textAlt');

  if (!roomMemberMap.size) return null;

  const member = roomMemberMap.get(data.memberId);
  if (!member) {
    logMessage(`[ RMI ] Unable to get room member data`, 'error');
    return null;
  }

  const title = member.name;
  const avatarLetter = title.at(0)?.toUpperCase();
  const newMsgCount = data.newMsgCount;

  const handlePress = () => {
    // onPress(data.id);
    router.push({
      pathname: '/room/[id]',
      params: { id: data.id, title },
    });
  };

  return (
    <TouchableOpacity activeOpacity={0.5} onPress={handlePress}>
      <View className="flex-row items-center gap-4 px-4 py-2">
        {/* Avatar */}
        <View
          className="flex-col w-16 h-16 items-center justify-center rounded-full"
          style={{ backgroundColor: cardAltColor }}
        >
          <Text className="text-2xl font-pbold">{avatarLetter}</Text>
        </View>

        {/* Room title */}
        <View className="flex-1">
          <Text colorName="textAlt" className="text-xl font-pbold">
            {title}
          </Text>
        </View>

        {/* New messages marker */}
        {newMsgCount > 0 && (
          <View
            className="flex-row h-4 w-4 items-center justify-center rounded-full mr-1"
            // style={{ backgroundColor: cardColor }}
          >
            {/* <Text className="font-psemibold">
              {newMsgCount}
            </Text> */}

            <View
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: textAltColor }}
            ></View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default RoomItem;
