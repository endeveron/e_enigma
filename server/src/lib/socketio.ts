import { Server, Socket } from 'socket.io';

import logger from '../helpers/logger';
import { updateUserOnlineStatus } from '../functions/user';

let io: Server | undefined;
const initErrMsg = 'Socket server not initialized';

const initSocketServer = (httpServer: any): Server => {
  // Avoid reinitializing
  if (io) return io;

  // Initialization
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      // credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // Get userId from the query parameters sent by the client
    const userId = socket.handshake.query.userId as string;

    if (userId) {
      // Assign the userId to socket.data
      socket.data.userId = userId;
      logger.info(`Connected socket ${socket.id}. User ID: ${userId}`);

      // Set user.isOnline to true in db
      updateUserOnlineStatus(userId, true);
    } else {
      logger.info(`Connected socket ${socket.id}`);
    }

    // Emitting an event 'userIdAssigned' that allows the client-side code
    // to receive the userId assigned to that particular socket connection
    socket.emit('userIdAssigned', { userId: socket.data.userId });

    // Connection is closed
    socket.conn.on('close', (reason) => {
      logger.info(`Disconnected socket ${socket.id}. Reason: ${reason}`);

      // Set user.isOnline to false in db
      const userId = socket.data.userId as string;
      if (userId) {
        updateUserOnlineStatus(userId, false);
      }
    });
  });

  logger.info('Socket.IO server initialized');

  return io;
};

const getSocketServer = (): Server => {
  if (!io) throw new Error(initErrMsg);
  return io;
};

const getSocket = (userId: string): Socket | undefined => {
  if (!io) throw new Error(initErrMsg);
  let socket: Socket | undefined;
  const socketMap = io.sockets.sockets;
  for (let [_, s] of socketMap) {
    if (s.data.userId === userId) {
      socket = s;
      break;
    }
  }
  return socket;
};

// const manageSocketRoom = (
//   actionType: 'join' | 'create' | 'leave',
//   userId: string,
//   roomId: string
// ) => {
//   if (!io) throw new Error(initErrMsg);
//   const socket = getSocket(userId);
//   if (!socket) {
//     logger.error(`No socket for the provided user id`);
//     return;
//   }

//   switch (actionType) {
//     case 'create':
//       {
//         socket.join(roomId);
//         logger.info(`Created room ${roomId}`);
//         logger.info(`Socket ${socket.id} joined room ${roomId}`);
//       }
//       break;
//     case 'join':
//       {
//         socket.join(roomId);
//         logger.info(`Socket ${socket.id} joined room ${roomId}`);
//         socket.to(roomId).emit('userJoined', { userId, roomId });
//       }
//       break;
//     case 'leave':
//       {
//         socket.leave(roomId);
//         logger.info(`Socket ${socket.id} leaved room ${roomId}`);
//         socket.to(roomId).emit('userLeaved', { userId, roomId });
//       }
//       break;
//   }
// };

export { initSocketServer, getSocketServer, getSocket };
