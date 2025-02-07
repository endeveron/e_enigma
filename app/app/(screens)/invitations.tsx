import { FlatList, View } from 'react-native';

import InvitationItem from '@/components/InvitationItem';
import NavBack from '@/components/NavBack';
import Title from '@/components/Title';
import { useChat } from '@/core/context/ChatProvider';
import { useSession } from '@/core/context/SessionProvider';
import { useSocket } from '@/core/context/SocketProvider';
import { logMessage } from '@/core/functions/helpers';
import { UserItem } from '@/core/types/chat';

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
    <View className="flex-1 pt-14 pb-4">
      <View className="relative h-16 flex-row items-center px-4">
        {/* Nav Back */}
        <View className="absolute top-0 left-2 w-10 h-full">
          <NavBack />
        </View>

        <View className="pl-10">
          <Title title="Invitations" />
        </View>
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
