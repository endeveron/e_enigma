import { Router } from 'express';
import { body } from 'express-validator';

import {
  reset,
  inviteUserToChat,
  getInvitations,
  deleteInvitation,
  getRooms,
  postRoom,
  getNewMessages,
  postMessage,
  updateMessagesMetadata,
  getInitialData,
} from '../controllers/chat';
import { handleHttpError } from '../helpers/error';
import { checkAuth } from '../middleware/check-auth';

const router = Router();

// Dev temp
router.get('/reset', reset);

router.use(checkAuth);

// Initialize chat data
router.get('/data', getInitialData);

// Invitation
router.get('/invite', inviteUserToChat);
router.get('/invitations', getInvitations);
router.delete('/invitation', deleteInvitation);

// Room
router.get('/rooms', getRooms);
router.post(
  '/room',
  [
    body('roomCreatorId').isLength({ min: 24, max: 24 }),
    body('invitedUserId').isLength({ min: 24, max: 24 }),
  ],
  postRoom
);

// Message
router.get('/new-messages', getNewMessages);
router.post(
  '/message-metadata',
  [
    body('userId').isLength({ min: 24, max: 24 }),
    body('roomId').isLength({ min: 24, max: 24 }),
    body('createdAtArr').isArray({ min: 1 }),
  ],
  updateMessagesMetadata
);
router.post(
  '/message',
  [
    body('senderId').isLength({ min: 24, max: 24 }),
    body('roomId').isLength({ min: 24, max: 24 }),
    body('data').notEmpty(),
    body('createdAt').notEmpty(),
  ],
  postMessage
);

router.use(handleHttpError);

export default router;
