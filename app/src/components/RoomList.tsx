import { useEffect, useState } from 'react';
import { FlatList } from 'react-native';

import RoomListItem from '@/src/components/RoomItem';
import ScreenNotification from '@/src/components/ScreenNotification';
import { useChat } from '@/src/context/ChatProvider';
import { getRoomMemberMap } from '@/src/functions/db';
import { RoomItem, RoomMemberMapItem } from '@/src/types/chat';

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
    <FlatList
      data={items}
      renderItem={(data) => (
        <RoomListItem data={data.item} roomMemberMap={memberMap} />
      )}
      keyExtractor={(item) => item.id}
    />
  );
};

export default RoomList;
