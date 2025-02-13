import { FlatList, View } from 'react-native';

import InvitationItem from '@/src/components/InvitationItem';
import NavBack from '@/src/components/NavBack';
import Title from '@/src/components/Title';
import { useChat } from '@/src/context/ChatProvider';
import { useSession } from '@/src/context/SessionProvider';
import { useSocket } from '@/src/context/SocketProvider';
import { logMessage } from '@/src/functions/helpers';
import { UserItem } from '@/src/types/chat';

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
  );
};

export default InvitationsScreen;
