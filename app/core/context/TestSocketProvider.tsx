import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { io, Socket } from 'socket.io-client';

import { SERVER_URL } from '@/core/constants';
import { logMessage } from '@/core/functions/helpers';

type TTestSocketContext = {
  getTestSocket: () => Socket | null;
};

const TestSocketContext = createContext<TTestSocketContext>({
  getTestSocket: () => null,
});

export const useTestSocket = () => {
  const value = useContext(TestSocketContext);
  if (process.env.NODE_ENV !== 'production') {
    if (!value) {
      throw new Error('useSocket must be wrapped in a <SocketProvider />');
    }
  }
  return value;
};

const TestSocketProvider = ({ children }: PropsWithChildren) => {
  const socketRef = useRef<Socket | null>(null);

  const initSocket = (): Socket => {
    const s = io(SERVER_URL, {
      // transports: ['websocket'],
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

    // s.on('connect_error', (error) => {
    //   console.log('[ SKT ] connect_error', error);

    //   if (s.active) {
    //     // Temporary failure, the socket will automatically try to reconnect
    //     logMessage(
    //       `[ SKP ] Socket temporary failure. Try to reconnect...`,
    //       'error'
    //     );
    //   } else {
    //     // The connection was denied by the server
    //     // in that case, `socket.connect()` must be manually called in order to reconnect
    //     logMessage(
    //       `[ SKP ] Socket connection was denied by the server. ${
    //         error?.message || ''
    //       }`,
    //       'error'
    //     );
    //     s.connect();
    //   }
    // });
  };

  const listenTest = (s: Socket) => {
    s.on('test', (data) => {
      logMessage(`[ SKP ] Test data: ${data}`);
    });
  };

  const getTestSocket = () => {
    return socketRef.current;
  };

  useEffect(() => {
    const s = initSocket();
    listenConnection(s);
    listenTest(s);

    logMessage(`[ SKP ] Listeners are run`);

    return () => {
      s.disconnect();
      s.removeAllListeners();
    };
  }, []);

  const value = {
    getTestSocket,
  };

  return (
    <TestSocketContext.Provider value={value}>
      {children}
    </TestSocketContext.Provider>
  );
};

export default TestSocketProvider;
