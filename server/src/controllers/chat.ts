import { NextFunction, Request, Response } from 'express';

import {
  configureRoomItems,
  getRoomMemberId,
  parseInvitations,
  parseMessages,
} from '../helpers/chat';
import { HttpError } from '../helpers/error';
import { isReqValid } from '../helpers/http';
import logger from '../helpers/logger';
import { getSocket } from '../lib/socketio';
import InvitationModel from '../models/invitation';
import MessageModel from '../models/message';
import RoomModel from '../models/room';
import UserModel from '../models/user';
import {
  EncryptedMessage,
  InvitationGroup,
  MessageMetadataItem,
  RoomItem,
  RoomMember,
  SystemMessageCode,
} from '../types/chat';
import { UserItem } from '../types/user';

export const reset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Remove all users
    const users = await UserModel.find();
    if (users.length) {
      for (let user of users) {
        await user.deleteOne();
      }
    }

    // Remove all invitations
    const invitations = await InvitationModel.find();
    if (invitations.length) {
      for (let invitation of invitations) {
        await invitation.deleteOne();
      }
    }

    // Remove all rooms
    const rooms = await RoomModel.find();
    if (rooms.length) {
      for (let room of rooms) {
        await room.deleteOne();
      }
    }

    // Remove all messages
    const messages = await MessageModel.find();
    if (messages.length) {
      for (let message of messages) {
        await message.deleteOne();
      }
    }

    res.status(200).json({
      data: true,
    });
  } catch (err: any) {
    logger.error('getInitialData', err);
    return next(new HttpError('Unable to get initial data.', 500));
  }
};

export const getInitialData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.query.userId as string;
  let roomItems: RoomItem[] = [];
  let roomMembers: RoomMember[] = [];
  let messages: EncryptedMessage[] = [];
  let invitations: InvitationGroup = {
    sent: [],
    recieved: [],
  };

  try {
    // Get user data, populate the invitations
    const user = await UserModel.findById(userId);
    if (!user) {
      return next(new HttpError('User not found.', 404));
    }

    // Get invitation documents from db
    const sentInvitDocs = await InvitationModel.find({ from: userId })
      .populate('to')
      .select('_id account.name account.imageUrl');
    const recievedInvitDocs = await InvitationModel.find({ to: userId })
      .populate('from')
      .select('_id account.name account.imageUrl');

    // Parse invitations
    if (sentInvitDocs.length) {
      invitations.sent = parseInvitations(sentInvitDocs);
    }
    if (recievedInvitDocs.length) {
      invitations.recieved = parseInvitations(recievedInvitDocs);
    }

    // Get the user's rooms sorted by `updatedAt` in descending order (fresh first)
    const userRooms = await RoomModel.find({ members: userId }, null, {
      sort: { updatedAt: -1 },
    });

    if (userRooms.length) {
      // Configure room items
      roomItems = await configureRoomItems(userRooms, userId);

      // Create room member id array
      const roomMemberIdSet: Set<string> = new Set();
      for (let r of roomItems) {
        roomMemberIdSet.add(r.memberId);
      }
      const roomMemberIdArr: string[] = Array.from(roomMemberIdSet);

      // Create room member array
      const users = await UserModel.find({
        _id: { $in: roomMemberIdArr },
      }).select('account.name account.imageUrl publicKey');
      if (!users.length) {
        return next(new HttpError('Unable to get users.', 500));
      }
      roomMembers = users.map((user: any) => ({
        id: user._id.toString(),
        name: user.account.name,
        imageUrl: user.account.imageUrl,
        publicKey: user.publicKey,
      }));
    }

    // Get all messages sent from / to the user
    const messageDocs = await MessageModel.find({
      $or: [{ senderId: userId }, { recipientId: userId }],
    });

    // Parse messages
    if (messageDocs.length) {
      messages = parseMessages(messageDocs);
    }

    res.status(200).json({
      data: {
        roomItems,
        roomMembers,
        messages,
        invitations,
      },
    });
  } catch (err: any) {
    logger.error('getInitialData', err);
    return next(new HttpError('Unable to get initial data.', 500));
  }
};

export const postRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!isReqValid(req, next)) return;
  const { roomCreatorId, invitedUserId } = req.body;

  try {
    // Check if the room already exists
    const existRoom = await RoomModel.findOne({
      members: [roomCreatorId, invitedUserId],
    });
    if (existRoom) {
      return next(new HttpError('Room already exists', 409));
    }

    // Get room creator
    const roomCreator = await UserModel.findById(roomCreatorId);
    if (!roomCreator) {
      return next(
        new HttpError(`User with id '${roomCreatorId}' not found.`, 404)
      );
    }

    // Get invited user
    const invitedUser = await UserModel.findById(invitedUserId);
    if (!invitedUser) {
      return next(
        new HttpError(`User with id '${invitedUser}' not found.`, 404)
      );
    }

    // Create a room
    const room = new RoomModel({
      members: [roomCreator._id, invitedUser._id],
      messages: [],
    });
    await room.save();

    // The invitation will be deleted in client > ChatProvider > acceptInvitation / rejectInvitation

    // Convert room.updatedAt Date into a timestamp
    const updated = new Date(room.updatedAt);
    const updatedAt = updated.getTime();

    res.status(200).json({
      data: {
        roomId: room._id.toString(),
        updatedAt,
        roomCreatorPublicKey: roomCreator.publicKey,
      },
    });
  } catch (err) {
    logger.error('postRoom', err);
    return next(new HttpError('Unable to create room.', 500));
  }
};

export const getRooms = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return next(new HttpError('Invalid user id', 409));
  }

  try {
    // Get the user's rooms sorted by `updatedAt` in descending order (fresh first)
    const userRooms = await RoomModel.find({ members: userId }, null, {
      sort: { updatedAt: -1 },
    });

    if (!userRooms.length) {
      res.status(200).json({
        data: {
          roomItems: [],
          roomMembers: [],
        },
      });
      return;
    }

    const roomItems = await configureRoomItems(userRooms, userId);

    // Get room members
    let roomMembers: RoomMember[] = [];
    // Create room member id array
    const roomMemberIdSet: Set<string> = new Set();
    for (let r of roomItems) {
      roomMemberIdSet.add(r.memberId);
    }
    const roomMemberIdArr: string[] = Array.from(roomMemberIdSet);
    // Create room member array
    const users = await UserModel.find({
      _id: { $in: roomMemberIdArr },
    }).select('account.name account.imageUrl publicKey');
    if (!users.length) {
      return next(new HttpError('Unable to get users.', 500));
    }
    roomMembers = users.map((user: any) => ({
      id: user._id.toString(),
      name: user.account.name,
      imageUrl: user.account.imageUrl,
      publicKey: user.publicKey,
    }));

    res.status(200).json({
      data: {
        roomItems,
        roomMembers,
      },
    });
  } catch (err: any) {
    logger.error('getRooms', err);
    return next(new HttpError('Unable to get rooms.', 500));
  }
};

export const inviteUserToChat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const roomCreatorId = req.query.roomCreatorId as string;
  const invitedUserId = req.query.invitedUserId as string;

  if (!roomCreatorId || !invitedUserId) {
    return next(new HttpError('Invalid user data', 409));
  }

  try {
    const roomCreator = await UserModel.findById(roomCreatorId).select(
      '_id account.name account.imageUrl'
    );
    if (!roomCreator) {
      return next(new HttpError('User not found.', 404));
    }

    const invitation = new InvitationModel({
      from: roomCreatorId,
      to: invitedUserId,
      isActive: true,
      timestamp: new Date().getTime(),
    });

    await invitation.save();

    // Find socket with invitation sender's id
    const socket = getSocket(invitedUserId);
    if (socket) {
      socket.emit('invitation', {
        type: 'offer',
        data: {
          id: roomCreator._id.toString(),
          name: roomCreator.account.name,
          imageUrl: roomCreator.account.imageUrl,
        },
      });
    }

    res.status(201).json({
      data: true,
    });
  } catch (err: any) {
    logger.error('inviteUserToChat', err);
    return next(new HttpError('Unable to save invitation.', 500));
  }
};

export const getInvitations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return next(new HttpError('Invalid user id', 409));
  }

  try {
    const docs: any[] = await InvitationModel.find({
      to: userId,
      isActive: true,
    }).populate('from');

    const recievedInvitations: UserItem[] = docs.map((data: any) => ({
      id: data.from._id.toString(),
      name: data.from.account.name,
      imageUrl: data.from.account.imageUrl,
    }));

    res.status(200).json({
      data: recievedInvitations,
    });
  } catch (err: any) {
    logger.error('getInvitations', err);
    return next(new HttpError('Unable to get invitations.', 500));
  }
};

export const deleteInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const roomCreatorId = req.query.roomCreatorId as string;
  const invitedUserId = req.query.invitedUserId as string;

  try {
    await InvitationModel.findOneAndDelete({
      from: roomCreatorId,
      to: invitedUserId,
    });

    res.status(200).json({
      data: true,
    });
  } catch (err) {
    logger.error('deleteInvitation', err);
    return next(new HttpError('Unable to delete the invitation.', 500));
  }
};

export const postMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!isReqValid(req, next)) return;

  const { senderId, roomId, data, createdAt } = req.body;

  try {
    // Find a room in db
    const room = await RoomModel.findById(roomId).populate({
      path: 'members',
      select: '_id account.name',
    });
    if (!room) {
      return next(new HttpError('Room not found.', 404));
    }

    // Get recipient id
    const recipientId = getRoomMemberId(room, senderId);
    if (!recipientId) {
      return next(new HttpError('Unable to get recipientId.', 409));
    }

    // Create a message
    const message = new MessageModel({
      roomId: room._id,
      senderId,
      recipientId,
      data,
      createdAt,
    });
    await message.save();

    // // Add message _id to the `room.messages`
    // room.messages.push(message._id);
    await room.save();

    // Serialize the message
    const encryptedMessage: EncryptedMessage = {
      id: message._id.toString(),
      roomId,
      senderId,
      recipientId,
      data, // encrypted: data, type, date
      createdAt,
    };

    // Emit `message` event via socket.io
    const socket = getSocket(recipientId);
    if (socket) {
      socket.emit('message:new', encryptedMessage);
    } else {
      // TODO: keep unsent messages
    }

    res.status(201).json({
      data: message._id.toString(),
    });
  } catch (err) {
    logger.error('postMessage', err);
    return next(new HttpError('Unable to create a message.', 500));
  }
};

export const getNewMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!isReqValid(req, next)) return;
  const userId = req.query.userId as string;
  const timestamp = req.query.timestamp as string | undefined;
  const errMsg = `Unable to get new mwessages.`;

  const baseQuery = {
    recipientId: userId,
    viewedAt: undefined,
  };

  const queryWithTimestamp = {
    createdAt: { $gt: +timestamp! },
    ...baseQuery,
  };

  const filterQuery = !!timestamp ? queryWithTimestamp : baseQuery;

  try {
    // Check if the user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return next(new HttpError(`${errMsg} User not found`, 404));
    }

    // Get all the messages sent to the user but not yet viewed by them
    const newMessageDocs = await MessageModel.find(filterQuery);

    // Parse messages
    const parsedMessages = parseMessages(newMessageDocs);

    res.status(200).json({
      data: parsedMessages,
    });
  } catch (err) {
    logger.error('getNewMessages', err);
    return next(new HttpError('', 500));
  }
};

export const updateMessagesMetadata = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!isReqValid(req, next)) return;

  const { userId, roomId, createdAtArr } = req.body;

  try {
    // Find a room in db
    const messageDocs = await MessageModel.find({
      roomId,
      senderId: userId,
      createdAt: { $in: createdAtArr },
    });
    if (!messageDocs.length) {
      return next(new HttpError('Messages data not found.', 404));
    }

    // Parse items
    const messageMetadataItems: MessageMetadataItem[] = messageDocs.map(
      (m: any) => ({
        id: m._id.toString(),
        createdAt: m.createdAt,
        recievedAt: m.recievedAt,
        viewedAt: m.viewedAt,
      })
    );

    res.status(201).json({
      data: messageMetadataItems,
    });
  } catch (err) {
    logger.error('updateMessagesMetadata', err);
    return next(new HttpError('Unable to update messages metadata.', 500));
  }
};

export const deleteMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const roomId = req.query.roomId as string;

  try {
    const messages = await MessageModel.find({
      roomId,
      systemCode: SystemMessageCode.E001,
    });

    if (messages.length === 1) {
      await messages[0].deleteOne();
    } else if (messages.length > 1) {
      for (let message of messages) {
        await message.deleteOne();
      }
    }

    res.status(200).json({
      data: true,
    });
  } catch (err) {
    logger.error('deleteMessage', err);
    return next(new HttpError('Unable to delete message.', 500));
  }
};
