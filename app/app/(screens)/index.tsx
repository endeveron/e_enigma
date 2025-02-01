import FeatherIcon from '@expo/vector-icons/Feather';
import MaterialIcon from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Button } from '@/components/Button';
import RoomList from '@/components/RoomList';
import ScreenNotification from '@/components/ScreenNotification';
import { Text } from '@/components/Text';
import Title from '@/components/Title';
import { useChat } from '@/core/context/ChatProvider';
import { useSession } from '@/core/context/SessionProvider';
import { getRoomItems as getRoomItemsFromLocalDb } from '@/core/functions/db';
import { useThemeColor } from '@/core/hooks/useThemeColor';
import { RoomItem } from '@/core/types/chat';
import { useRouter } from 'expo-router';
import { EventType, useEvent } from '@/core/context/EventProvider';

export default function HomeScreen() {
  const router = useRouter();
  const { event } = useEvent();
  const { session, signOut } = useSession();
  const { recievedInvitations, roomMemberMap } = useChat();

  const [fetching, setFetching] = useState(false);
  const [roomItems, setRoomItems] = useState<RoomItem[]>([]);
  const [isNoData, setIsNoData] = useState(false);
  const [isInvitations, setIsInvitations] = useState(false);

  // const textColor = useThemeColor('text');
  const mutedColor = useThemeColor('muted');
  const cardColor = useThemeColor('card');

  // const token = session!.token;
  // const userId = session!.user.id;
  const userName = session!.user.account.name;

  const recievedInvitationsLength = recievedInvitations.length;
  const isRecievedInvitations = recievedInvitationsLength > 0;
  const isRoomItems = roomItems.length > 0;
  const isData = isRecievedInvitations && isRoomItems;
  const isOnlyInvitations = isRecievedInvitations && !isRoomItems;

  // const bottomSheetRef = useRef<BottomSheet>(null);
  // const bottomSheetSnapPoints = useMemo(() => ['35%'], []);

  // const handleToggle = async () => {};

  // const handleOpenBottomSheet = () => {
  //   bottomSheetRef.current?.expand();
  // };

  // const getRoomsFromRemoteDb = async () => {
  //   setFetching(true);
  //   const roomsRes = await getDataFromRemoteDb(authData);
  //   setFetching(false);
  //   if (!roomsRes?.data) {
  //     const errMsg = roomsRes?.error?.message ?? 'Unable to recieve rooms';
  //     logMessage(`[ RML ] ${errMsg}`, 'error');
  //     showToast('Unable to recieve data');
  //     return;
  //   }
  //   logMessage(`[ RML ] Data fetched from remote db`);
  //   // console.log(`[ F ] 2.1 RoomList > initData: Data fetched from remote db`);
  //   setRoomItems(roomsRes.data);
  // };

  const handleOpenInvitations = () => {
    router.push('/invitations');
  };

  const handleOpenSearch = () => {
    router.push('/search');
  };

  const updRoomItems = async () => {
    setFetching(true);
    // Get room items from local db
    const roomData = await getRoomItemsFromLocalDb();
    roomData && setRoomItems(roomData);
    setFetching(false);
  };

  // Init rooms
  useEffect(() => {
    updRoomItems();
  }, []);

  // Update message count
  useEffect(() => {
    if (!event) return;
    if (
      (event.type === EventType.INVITATION_ANSWER &&
        event.payload === 'accepted') ||
      event.type === EventType.ROOM_MEMBER_MAP_UPD
    ) {
      updRoomItems();
    }
  }, [event]);

  useEffect(() => {
    if (isData) {
      if (isNoData) setIsNoData(false);
      return;
    }

    const timerId = setTimeout(() => {
      if (isOnlyInvitations) {
        setIsInvitations(true);
        if (isNoData) setIsNoData(false);
      }
      if (!isData) {
        setIsNoData(true);
        if (isInvitations) setIsInvitations(false);
      }
    }, 1000);

    return () => {
      timerId && clearTimeout(timerId);
    };
  }, [isData, isOnlyInvitations]);

  if (fetching)
    return <ScreenNotification message="Please wait" delay={1500} />;

  return (
    <View className="relative flex-1 pt-14 pb-4">
      {/* No rooms */}
      {!isRoomItems && (isNoData || isOnlyInvitations) ? (
        <View className="pt-14 flex-1 flex-col items-center justify-center p-4">
          <Text colorName="accent" className="text-4xl font-pbold mb-2">
            Hey, {userName}!
          </Text>
          <Text className="text-lg font-pregular my-4">
            {isOnlyInvitations
              ? `You have ${recievedInvitationsLength} invitation${
                  recievedInvitationsLength > 1 ? "'s" : ''
                }`
              : `Let's see`}
          </Text>
          <Button
            containerClassName="mb-8"
            title={
              isOnlyInvitations ? `Go to invitations` : `Who's up for a chat`
            }
            handlePress={
              isOnlyInvitations ? handleOpenInvitations : handleOpenSearch
            }
          />
        </View>
      ) : null}

      {/* Invitations */}
      {isRoomItems && isRecievedInvitations ? (
        <View className="h-16 flex-row items-center justify-between px-4">
          <Title title="Invitations" />
          <TouchableOpacity
            className="animate-fade-in"
            onPress={handleOpenInvitations}
          >
            <View
              className="px-4 py-2 rounded-full -mr-2"
              style={{ backgroundColor: cardColor }}
            >
              <Text colorName="accent" className="font-pbold text-xl">
                {recievedInvitationsLength}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Rooms */}
      {isRoomItems ? (
        <>
          <View className="h-16 flex-row items-center justify-between px-4">
            <Title title="Rooms" />
            <TouchableOpacity
              className="h-16 w-6 flex-row items-center justify-center animate-fade-in"
              onPress={handleOpenSearch}
            >
              <FeatherIcon size={24} name="plus" color={mutedColor} />
            </TouchableOpacity>
          </View>
          <RoomList roomItems={roomItems} />
        </>
      ) : null}

      {/* Sign Out */}
      <View className="absolute flex-row bottom-6 right-4 opacity-80">
        <TouchableOpacity activeOpacity={0.5} onPress={signOut}>
          {/* <Text colorName="muted" className="text-lg font-pmedium">
            Log Out
          </Text> */}
          <MaterialIcon size={22} name="logout" color={mutedColor} />
        </TouchableOpacity>
      </View>

      {/* Background image */}
      {/* <View className="absolute flex-1 items-center justify-center h-full w-full inset-x-0 inset-y-0 z-10">
        <Image
          style={{ flex: 1, width: '100%' }}
          source={bgImgSource}
          contentFit="cover"
          transition={500}
        />
      </View> */}
    </View>
  );
}
