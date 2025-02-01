import logger from '../helpers/logger';
import MessageModel from '../models/message';
import { InvitationAnswerData, MessageEventData } from '../types/chat';
import { getSocket } from '../lib/socketio';

export const handleInvitationAnswer = async (data: InvitationAnswerData) => {
  const errMsg = '❌ Unable to handle invitation report.';
  if (!data?.event || !data?.from || !data?.to) {
    logger.r(`${errMsg} Invalid invitation data.`);
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
  const errMsg = '❌ Unable to handle message report.';
  if (!reportData?.messageId || !reportData?.recipientId) {
    logger.r(`${errMsg} Invalid message data.`);
    return;
  }

  // Find the message in db
  const message = await MessageModel.findById(reportData.messageId);
  if (!message) {
    logger.r(`${errMsg} Message not found in db.`);
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
