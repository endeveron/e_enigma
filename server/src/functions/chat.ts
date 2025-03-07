import logger from '../helpers/logger';
import MessageModel from '../models/message';
import {
  InvitationAnswerData,
  Message,
  MessageEventData,
  SystemMessageCode,
} from '../types/chat';
import { getSocket } from '../lib/socketio';
import RoomModel from '../models/room';
import { Result, Status } from '../types/common';
import { getRoomMemberId } from '../helpers/chat';

export const handleInvitationAnswer = async (data: InvitationAnswerData) => {
  const errMsg = 'Unable to handle invitation report.';
  if (!data?.event || !data?.from || !data?.to) {
    logger.error(`${errMsg} Invalid invitation data.`);
    return;
  }

  // Find socket with invitation sender's id
  const socket = getSocket(data.from);
  if (socket) {
    socket.emit('invitation', {
      type: 'answer',
      data,
    });
  } else {
    // TODO: keep unsent invitation reports
  }
};

export const handleMessageReport = async (reportData: MessageEventData) => {
  const errMsg = 'Unable to handle message report.';
  if (!reportData?.messageId || !reportData?.recipientId) {
    logger.error(`${errMsg} Invalid message data.`);
    return;
  }

  // Find the message in db
  const message = await MessageModel.findById(reportData.messageId);
  if (!message) {
    logger.error(`${errMsg} Message not found in db.`);
    return;
  }

  // Update metadata
  if (reportData.recievedAt && !message.recievedAt) {
    message.recievedAt = reportData.recievedAt;
  }
  if (reportData.viewedAt && !message.viewedAt) {
    message.viewedAt = reportData.viewedAt;
  }

  await message.save();

  // Find socket with sender's userId
  const socket = getSocket(reportData.senderId);
  if (socket) {
    // Confifure event data
    const eventData: MessageEventData = reportData;
    if (!reportData.roomId) {
      reportData.roomId = message.roomId.toString();
    }

    if (reportData.recievedAt) eventData.recievedAt = reportData.recievedAt;
    if (reportData.viewedAt) eventData.viewedAt = reportData.viewedAt;
    socket.emit('message:metadata', eventData);
  } else {
    // TODO: keep unsent message reports
  }
};

export const sendSystemMessage = async (
  userId: string,
  data: string
): Promise<Result<Status>> => {
  try {
    // Get the user's rooms
    const userRooms = await RoomModel.find({ members: userId });
    if (!userRooms.length) {
      return {
        data: null,
        error: { message: `User has no rooms` },
      };
    }
    // Create a system message for each room
    const createdAt = Date.now();

    for (let room of userRooms) {
      // Get recipient id
      const members = room.members;
      const userIndex = members.findIndex((id) => id.toString() === userId);
      let senderId;
      let recipientId;
      if (userIndex === 0) {
        senderId = members[0];
        recipientId = members[1];
      } else {
        senderId = members[1];
        recipientId = members[0];
      }
      await MessageModel.create({
        roomId: room._id,
        senderId,
        recipientId,
        data,
        createdAt,
        systemCode: SystemMessageCode.E001,
      });
    }

    return {
      data: { success: true },
      error: null,
    };
  } catch (err: any) {
    console.error(`sendSystemMessage: ${err}`);
    return {
      data: null,
      error: { message: `Unable to send system message` },
    };
  }
};
