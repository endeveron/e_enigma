import compression from 'compression';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { Server } from 'http';

import { mongoDb } from './db/mongo';
import { handleInvitationAnswer, handleMessageReport } from './functions/chat';
import logger from './helpers/logger';
import { getSocketServer, initSocketServer } from './lib/socketio';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import userRoutes from './routes/user';
import { InvitationAnswerData, MessageEventData } from './types/chat';

const API_VERSION = '1';
const API = `/api/v${API_VERSION}`;
const PORT = process.env.PORT || 3000;
let httpServer: Server | null = null;

const createApp = (): Application => {
  const app = express();
  return app;
};

const configureMiddleware = (app: Application): Application => {
  // Security middleware
  app.use(cors());

  // Request parsing
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Performance middleware
  app.use(compression());

  // Trust the first proxy (Google Load Balancer)
  app.set('trust proxy', 1);

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  return app;
};

const configureRoutes = (app: Application): Application => {
  // API Endpoints
  app.use(`${API}/auth`, authRoutes);
  app.use(`${API}/chat`, chatRoutes);
  app.use(`${API}/user`, userRoutes);

  // Health check endpoint
  app.use(`${API}/health`, (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: Date.now(),
    });
  });

  return app;
};

const configureErrorHandling = (app: Application): Application => {
  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not found',
      status: 404,
    });
  });

  // Global error handler
  app.use((err: Error, _req: Request, res: Response) => {
    logger.error(`Unhandled error: ${err.message}`, { error: err });

    res.status(500).json({
      error: 'Internal server error',
      status: 500,
    });
  });

  return app;
};

const connectToSocket = async (server: Server): Promise<void> => {
  try {
    // Initialize Socket.IO
    initSocketServer(server);
    const io = getSocketServer();

    // Socket event handlers
    io.on('connection', (socket) => {
      logger.info(`Socket connected: ${socket.id}`);

      socket.on('invitation:answer', (data: InvitationAnswerData) => {
        try {
          handleInvitationAnswer(data);
        } catch (error) {
          logger.error(`Error handling invitation answer: ${error}`);
        }
      });

      socket.on('message:report', (data: MessageEventData) => {
        try {
          handleMessageReport(data);
        } catch (error) {
          logger.error(`Error handling message report: ${error}`);
        }
      });

      socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
      });
    });

    logger.info('Socket.IO server initialized');
  } catch (error) {
    logger.error(`Failed to initialize Socket.IO: ${error}`);
    throw error;
  }
};

const connectToDatabase = async (): Promise<void> => {
  const errorMessage = await mongoDb.connect();
  if (errorMessage) throw new Error(errorMessage);
};

const startServer = (app: Application): Server => {
  const server = app.listen(PORT, () => {
    logger.info(`Server started on port ${PORT}`);
  });

  return server;
};

// Clean shutdown
const setupShutdownHandlers = (server: Server): void => {
  const shutdown = async (): Promise<void> => {
    logger.info('Shutting down server...');

    // Close Socket.IO connections
    const io = getSocketServer();
    if (io) {
      // Notify all clients before disconnecting
      io.emit('server:shutdown', { message: 'Server is shutting down' });

      // Close all Socket.IO connections
      io.disconnectSockets();

      // Close the Socket.IO server
      await new Promise<void>((resolve) => {
        io.close(() => {
          logger.info('Socket.IO connections closed');
          resolve();
        });
      });
    }

    // Close HTTP server
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => {
          logger.info('HTTP server closed');
          resolve();
        });
      });
    }

    await mongoDb.disconnect();

    logger.info('Server closed');
    process.exit(0);
  };

  // Handle different signals
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error });
    shutdown();
  });
};

// Main function to run the server
const run = async (): Promise<void> => {
  try {
    // Create and configure the app
    const app = createApp();
    configureMiddleware(app);
    configureRoutes(app);
    configureErrorHandling(app);

    // Connect to the database and start the server
    await connectToDatabase();
    httpServer = startServer(app);

    // Initialize Socket.IO
    await connectToSocket(httpServer);

    setupShutdownHandlers(httpServer);
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Start the application
run().catch((error) => {
  logger.error('Unhandled error in startup', { error });
  process.exit(1);
});
