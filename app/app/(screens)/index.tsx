import FeatherIcon from '@expo/vector-icons/Feather';
import MaterialIcon from '@expo/vector-icons/MaterialIcons';
// import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Button } from '@/src/components/Button';
import RoomList from '@/src/components/RoomList';
import ScreenNotification from '@/src/components/ScreenNotification';
import { Text } from '@/src/components/Text';
import Title from '@/src/components/Title';
import { useChat } from '@/src/context/ChatProvider';
import { EventType, useEvent } from '@/src/context/EventProvider';
import { useSession } from '@/src/context/SessionProvider';
import { getRoomItems as getRoomItemsFromLocalDb } from '@/src/functions/db';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { RoomItem } from '@/src/types/chat';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const { event } = useEvent();
  const { session, signOut } = useSession();
  const { recievedInvitations } = useChat();

  const [fetching, setFetching] = useState(false);
  const [roomItems, setRoomItems] = useState<RoomItem[]>([]);
  const [isNoData, setIsNoData] = useState(false);
  const [isInvitations, setIsInvitations] = useState(false);

  // const bottomSheetRef = useRef<BottomSheet>(null);
  // const bottomSheetSnapPoints = useMemo(() => ['15%'], []);

  const mutedColor = useThemeColor('muted');
  const cardColor = useThemeColor('card');

  const userName = session!.user.account.name;
  const recievedInvitationsLength = recievedInvitations.length;
  const isRecievedInvitations = recievedInvitationsLength > 0;
  const isRoomItems = roomItems.length > 0;
  const isData = isRecievedInvitations && isRoomItems;
  const isOnlyInvitations = isRecievedInvitations && !isRoomItems;

  const handleOpenInvitations = () => {
    router.push('/invitations');
  };

  const handleOpenSearch = () => {
    router.push('/search');
  };

  // const handleOpenBottomSheet = () => {
  //   bottomSheetRef.current?.expand();
  // };

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
      event.type === EventType.ROOM_MEMBER_MAP_UPD ||
      event.type === EventType.FIRST_INIT
    ) {
      updRoomItems();
    }
  }, [event]);

  useEffect(() => {
    if (isData) {
      if (isNoData) setIsNoData(false);
      return;
    }

    setTimeout(() => {
      if (isOnlyInvitations) {
        setIsInvitations(true);
        if (isNoData) setIsNoData(false);
      }
      if (!isData) {
        setIsNoData(true);
        if (isInvitations) setIsInvitations(false);
      }
    }, 500);
  }, [isData, isOnlyInvitations]);

  if (fetching)
    return <ScreenNotification message="Please wait" delay={1500} />;

  return (
    <View className="flex-1 pt-14">
      {/* Content */}
      <View className="flex-1">
        {/* No rooms */}
        {!isRoomItems && (isNoData || isOnlyInvitations) ? (
          <View className="flex-1 flex-col items-center justify-center p-4">
            <Text colorName="title" className="text-4xl font-pbold mb-2">
              Hey, {userName}!
            </Text>
            <Text className="text-lg font-pmedium my-4">
              {isOnlyInvitations
                ? `You have ${recievedInvitationsLength} invitation${
                    recievedInvitationsLength > 1 ? "'s" : ''
                  }`
                : `Let's see`}
            </Text>
            <Button
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
                <Text className="font-pbold text-xl">
                  {recievedInvitationsLength}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Rooms */}
        {isRoomItems ? (
          <View className="flex-1">
            <View className="h-16 flex-row items-center justify-between px-4">
              <Title title="Rooms" />
              <Button
                variant="secondary"
                icon={<FeatherIcon size={22} name="plus" color={mutedColor} />}
                handlePress={handleOpenSearch}
              ></Button>
            </View>
            <RoomList roomItems={roomItems} />
          </View>
        ) : null}
      </View>

      {/* Bottom navbar */}
      <View className="flex-row justify-center p-6">
        <Button
          variant="secondary"
          icon={<MaterialIcon size={22} name="logout" color={mutedColor} />}
          handlePress={signOut}
        ></Button>
      </View>

      {/* Bottom sheet */}
      {/* <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={bottomSheetSnapPoints}
        enablePanDownToClose={true}
        handleIndicatorStyle={{
          height: 6,
          width: 80,
          backgroundColor: borderColor,
        }}
        backgroundStyle={{
          backgroundColor: cardColor,
          borderRadius: 24,
          margin: 10,
        }}
      >
        <BottomSheetView>
          <View className="flex-col px-12 py-2">
            <TouchableOpacity className="py-6" onPress={signOut}>
              <Text className="text-center text-lg font-pmedium">Log out</Text>
            </TouchableOpacity>
            <View
              className="h-[1px]"
              style={{ backgroundColor: borderColor }}
            ></View>
          </View>
        </BottomSheetView>
      </BottomSheet> */}
    </View>
  );
}
