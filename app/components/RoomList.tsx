import { useEffect, useState } from 'react';
import { View } from 'react-native';

import RoomListItem from '@/components/RoomItem';
import ScreenNotification from '@/components/ScreenNotification';
import { useChat } from '@/core/context/ChatProvider';
import { RoomItem, RoomMemberMapItem } from '@/core/types/chat';
import { getRoomMemberMap } from '@/core/functions/db';

type RoomListProops = {
  roomItems: RoomItem[];
};

const RoomList = ({ roomItems }: RoomListProops) => {
  const { newMessageMap, roomMemberMap } = useChat();

  const [memberMap, setMemberMap] = useState<Map<string, RoomMemberMapItem>>(
    new Map()
  );
  const [items, setItems] = useState<RoomItem[]>([]);

  const initRoomMemberMap = async () => {
    // Get room member map from local db
    const memberMapFromLocalDb = await getRoomMemberMap();
    console.info(
      `[ F ] RML1 Room member map fetched from local db / initRoomMemberMap`
    );
    setMemberMap(memberMapFromLocalDb);
  };

  // Get new messages count for each room
  const updateNewMessagesCount = () => {
    if (!roomItems) return;
    const updItems: RoomItem[] = [];
    for (let room of roomItems) {
      updItems.push({
        ...room,
        newMsgCount: newMessageMap.get(room.id)?.length ?? 0,
      });
    }
    console.info(`[ F ] RML2 Room items updated / updateNewMessagesCount`);
    setItems(updItems);
  };

  useEffect(() => {
    setItems(roomItems);

    if (!roomMemberMap.size) {
      initRoomMemberMap();
    }
  }, []);

  useEffect(() => {
    if (!roomMemberMap.size) return;
    setMemberMap(roomMemberMap);
  }, [roomMemberMap]);

  // Update messages count
  useEffect(() => {
    updateNewMessagesCount();
  }, [newMessageMap]);

  if (!items?.length) return <ScreenNotification message="No rooms" />;

  return (
    <View className="flex-col">
      {items.map((data) => (
        <RoomListItem data={data} roomMemberMap={memberMap} key={data.id} />
      ))}
    </View>
  );
};

export default RoomList;
