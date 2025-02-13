import React, { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';

import ScreenNotification from '@/src/components/ScreenNotification';
import UserListItem from '@/src/components/UserItem';
import { useChat } from '@/src/context/ChatProvider';
import { useSession } from '@/src/context/SessionProvider';
import { getInvitationMap, insertInvitations } from '@/src/functions/db';
import { logMessage } from '@/src/functions/helpers';
import { inviteUserToChat } from '@/src/services/chat';
import { searchUser } from '@/src/services/user';
import { InvitatoionMapItem, UserItem, UserItemExt } from '@/src/types/chat';
import SearchInput from '@/src/components/SearchInput';
import { EventType, useEvent } from '@/src/context/EventProvider';
import { useRouter } from 'expo-router';
import { useToast } from '@/src/hooks/useToast';
import Title from '@/src/components/Title';
import NavBack from '@/src/components/NavBack';
import { MAIN_REDIRECT_URL } from '@/src/constants';

const SearchScreen = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { session } = useSession();
  const { roomMemberMap } = useChat();
  const { event } = useEvent();

  const [fetching, setFetching] = useState(false);
  const [sentInvitationMap, setSentInvitationMap] = useState<
    Map<string, InvitatoionMapItem>
  >(new Map());
  const [items, setItems] = useState<UserItemExt[] | null>(null);

  const token = session!.token;
  const userId = session!.user.id;

  const handleSearch = async (value: string) => {
    setItems([]);
    setFetching(true);

    try {
      // Search user by email
      // GET: /user/search?query=<query>&userId=<userId>
      const res = await searchUser({
        query: value,
        token,
        userId,
      });

      if (!res?.data) {
        const errMsg = res?.error?.message ?? 'Unable to search';
        logMessage(`[ SER ] ${errMsg}`, 'error');
        return;
      }
      if (res.data.length) {
        const userItemsExt: UserItemExt[] = res.data.map((data: UserItem) => ({
          ...data,
          isInvite: !roomMemberMap.has(data.id),
        }));
        setItems(userItemsExt);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const loadSentInvitationMap = async (invitationAnswer?: string) => {
    const updSentInvitationMap = await getInvitationMap('sent');
    const prevMapSize = sentInvitationMap.size;
    const newMapSize = updSentInvitationMap.size;

    if (prevMapSize - newMapSize === 1) {
      if (invitationAnswer) {
        showToast(`Invitation ${invitationAnswer}`, true);
      }
      if (newMapSize === 0) {
        // Redirect if the invitations list is empty
        router.push(MAIN_REDIRECT_URL);
      }
    }

    setSentInvitationMap(updSentInvitationMap);
  };

  const handleInvite = async (data: UserItemExt) => {
    try {
      // Invite user to chat
      // GET: /chat/invite?roomCreatorId=<roomCreatorId>&invitedUserId=<invitedUserId>
      const res = await inviteUserToChat({
        roomCreatorId: userId,
        invitedUserId: data.id,
        token,
      });

      if (!res?.data) {
        const errMsg = res?.error?.message ?? 'Unable to invite user to chat';
        logMessage(`[ SER ] ${errMsg}`, 'error');
        return;
      }

      // Add userItem to local db 'invitation_sent' table
      const { isInvite, ...userItem } = data;
      const success = await insertInvitations([userItem], 'sent');
      success && loadSentInvitationMap();
    } catch (err: any) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadSentInvitationMap();
  }, []);

  useEffect(() => {
    if (event?.type === EventType.INVITATION_ANSWER) {
      console.info(`[ R ] SearchScreen: event INVITATION_ANSWER`);
      loadSentInvitationMap(event.payload);
    }
  }, [event]);

  return (
    <View className="flex-1 pt-14">
      <View className="h-16 flex-row items-center gap-4 px-4 mb-2">
        <NavBack />
        <Title title="Create a room" />
      </View>

      <SearchInput
        onSearch={handleSearch}
        placeholder="Find a chat buddy by email..."
      />

      {fetching ? (
        <ScreenNotification message="Please wait" delay={1500} />
      ) : null}

      {items && items.length === 0 ? (
        <ScreenNotification message="No matches found" delay={1000} />
      ) : null}

      {items && items.length > 0 ? (
        <FlatList
          className="py-2"
          data={items}
          renderItem={(data) => (
            <UserListItem
              data={data.item}
              sentInvitationMap={sentInvitationMap}
              onPress={handleInvite}
            />
          )}
          keyExtractor={(item) => item.id}
        />
      ) : null}
    </View>
  );
};

export default SearchScreen;
