import cors from 'cors';
import express from 'express';

import { mongo } from './db/mongo';
import { handleInvitationAnswer, handleMessageReport } from './functions/chat';
import { getSocketServer, initSocketServer } from './lib/socketio';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import userRoutes from './routes/user';
import { InvitationAnswerData, MessageEventData } from './types/chat';
import logger from './helpers/logger';

const API_VERSION = `/api/v1`;

// Init app
const app = express();
const server = app.listen(process.env.PORT);

// Middleware to set up Cross-Origin Resource Sharing
app.use(cors());
// Middleware to parse JSON bodies
app.use(express.json());

// Socket.io
initSocketServer(server);
const io = getSocketServer();

// Routes
app.use(`${API_VERSION}/auth`, authRoutes);
app.use(`${API_VERSION}/chat`, chatRoutes);
app.use(`${API_VERSION}/user`, userRoutes);

app.use(`/ping`, (req, res) => {
  res.status(200).json({ message: 'Ping OK' });
});

app.use((req, res) => {
  res.status(404).send('Not found');
});

// Connect to DB
mongo
  .connect()
  .then(async () => {})
  .catch((err) => console.log(err));

// Listening to socket events
io.on('connection', (socket) => {
  socket.on('invitation:answer', (data: InvitationAnswerData) => {
    handleInvitationAnswer(data);
  });

  socket.on('message:report', (data: MessageEventData) => {
    handleMessageReport(data);
  });
});
