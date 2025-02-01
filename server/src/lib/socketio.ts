import { Server, Socket } from 'socket.io';

import logger from '../helpers/logger';

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

  // if (io) {
  //   logger.b(`✔️ Socket server initialized`);
  // }

  io.on('connection', (socket) => {
    logger.b(`✔️ Socket connection`);

    // Get userId from the query parameters sent by the client
    const userIdFromQuery = socket.handshake.query.userId;

    if (userIdFromQuery) {
      // Assign the userId to socket.data
      socket.data.userId = userIdFromQuery;
      logger.b(`✔️ User ID ${socket.data.userId} added to socket ${socket.id}`);
    } else {
      logger.r(`❌ No user ID provided during connection`);
    }

    // Connection is opened
    logger.b(`✔️ Connected socket ${socket.id}`);
    socket.emit('userIdAssigned', { userId: socket.data.userId });

    // Connection is closed
    socket.conn.on('close', (reason) => {
      logger.y(`❌ Disconnected socket ${socket.id}. Reason: ${reason}`);
    });
  });

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
//     logger.r(`❌ No socket for the provided user id`);
//     return;
//   }

//   switch (actionType) {
//     case 'create':
//       {
//         socket.join(roomId);
//         logger.b(`✔️ Created room ${roomId}`);
//         logger.b(`✔️ Socket ${socket.id} joined room ${roomId}`);
//       }
//       break;
//     case 'join':
//       {
//         socket.join(roomId);
//         logger.b(`✔️ Socket ${socket.id} joined room ${roomId}`);
//         socket.to(roomId).emit('userJoined', { userId, roomId });
//       }
//       break;
//     case 'leave':
//       {
//         socket.leave(roomId);
//         logger.b(`✔️ Socket ${socket.id} leaved room ${roomId}`);
//         socket.to(roomId).emit('userLeaved', { userId, roomId });
//       }
//       break;
//   }
// };

export { initSocketServer, getSocketServer, getSocket };
