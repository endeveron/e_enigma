import { Stack } from 'expo-router';
import { FlatList, View } from 'react-native';

import InvitationItem from '@/components/InvitationItem';
import NavBack from '@/components/NavBack';
import Title from '@/components/Title';
import { useChat } from '@/context/ChatProvider';
import { useSession } from '@/context/SessionProvider';
import { useSocket } from '@/context/SocketProvider';
import { logMessage } from '@/functions/helpers';
import { UserItem } from '@/types/chat';

const InvitationsScreen = () => {
  const { session } = useSession();
  const { getSocket } = useSocket();
  const { recievedInvitations, acceptInvitation, rejectInvitation } = useChat();

  const socket = getSocket();
  const userId = session!.user.id;

  const handleAcceptInvitation = async (roomCreator: UserItem) => {
    logMessage(`[ INS ] Accepted invitation from ${roomCreator.name}`);

    await acceptInvitation(roomCreator);

    if (!socket) {
      logMessage(`[ CHR ] Unable to get socket instance`, 'error');
      return;
    }
    socket.emit('invitation:answer', {
      event: 'accepted',
      from: roomCreator.id,
      to: userId,
    });
  };

  const handleRejectInvitation = async (roomCreator: UserItem) => {
    logMessage(`[ INS ] Rejected invitation from ${roomCreator.name}`);

    await rejectInvitation(roomCreator.id);

    if (!socket) {
      logMessage(`[ CHR ] Unable to get socket instance`, 'error');
      return;
    }
    socket.emit('invitation:answer', {
      event: 'rejected',
      from: roomCreator.id,
      to: userId,
    });
  };

  return (
    <>
      <Stack.Screen />
      <View className="flex-1 pt-14">
        <View className="h-16 flex-row items-center gap-4 px-4 mb-2">
          <NavBack />
          <Title title="Invitations" />
        </View>

        <FlatList
          data={recievedInvitations}
          renderItem={(data) => (
            <InvitationItem
              data={data.item}
              onAccept={() => handleAcceptInvitation(data.item)}
              onReject={() => handleRejectInvitation(data.item)}
            />
          )}
          keyExtractor={(item) => item.id}
        />
      </View>
    </>
  );
};

export default InvitationsScreen;
