import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { io, Socket } from 'socket.io-client';

import { SERVER_URL } from '@/constants';
import { useChat } from '@/context/ChatProvider';
import { useSession } from '@/context/SessionProvider';
import { logMessage } from '@/functions/helpers';
import { EncryptedMessage } from '@/types/chat';

type TSocketContext = {
  getSocket: () => Socket | null;
};

const SocketContext = createContext<TSocketContext>({
  getSocket: () => null,
});

export const useSocket = () => {
  const value = useContext(SocketContext);
  if (process.env.NODE_ENV !== 'production') {
    if (!value) {
      throw new Error('useSocket must be wrapped in a <SocketProvider />');
    }
  }
  return value;
};

const SocketProvider = ({ children }: PropsWithChildren) => {
  const { session } = useSession();
  const { onInvitation, onMessage, onMessageUpdMetadata } = useChat();
  const socketRef = useRef<Socket | null>(null);

  const userId = session!.user.id;

  const initSocket = (): Socket => {
    const s = io(SERVER_URL, {
      query: { userId },
    });
    socketRef.current = s;
    return s;
  };

  const listenConnection = (s: Socket) => {
    s.on('connect', () => {
      logMessage(`[ SKP ] Connected socket ${s.id}`);
    });

    s.on('disconnect', () => {
      logMessage(`[ SKP ] Disconnected socket`, 'error');
    });

    s.on('connect_error', (error) => {
      logMessage(`[ SKP ] 'connect_error'`, 'error');
      console.error(error);

      if (s.active) {
        // Temporary failure, the socket will automatically try to reconnect
        logMessage(
          `[ SKP ] Socket temporary failure. Try to reconnect...`,
          'error'
        );
      } else {
        // The connection was denied by the server
        // in that case, `socket.connect()` must be manually called in order to reconnect
        logMessage(
          `[ SKP ] Socket connection was denied by the server. ${
            error?.message || ''
          }`,
          'error'
        );
        s.connect();
      }
    });
  };

  const listenUserAssigned = (s: Socket) => {
    s.on('userIdAssigned', (data) => {
      logMessage(`[ SKP ] User ID ${data.userId} added to socket`);
    });
  };

  const listenInvitation = (s: Socket) => {
    s.on('invitation', onInvitation);
  };

  const listenMessage = (s: Socket) => {
    s.on('message:new', (message: EncryptedMessage) => {
      onMessage(message, s);
    });
  };

  const listenMessageUpdMetadata = (s: Socket) => {
    s.on('message:metadata', onMessageUpdMetadata);
  };

  const getSocket = () => {
    return socketRef.current;
  };

  useEffect(() => {
    if (!session) return;

    const s = initSocket();
    listenConnection(s);
    listenUserAssigned(s);
    listenInvitation(s);
    listenMessage(s);
    listenMessageUpdMetadata(s);

    logMessage(`[ SKP ] Listeners are run`);

    return () => {
      s.disconnect();
      s.removeAllListeners();
    };
  }, []);

  const value = {
    getSocket,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export default SocketProvider;
