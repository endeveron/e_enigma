import { Schema, model } from 'mongoose';

import { Message } from '../types/chat';

const messageSchema = new Schema<Message>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room ID is required'],
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient ID is required'],
    },
    data: {
      type: String,
      required: [true, 'Message data is required'],
    },
    createdAt: {
      type: Number,
      required: [true, 'createdAt timestamp is required'],
    },
    recievedAt: { type: Number },
    viewedAt: { type: Number },
    systemCode: { type: String },
  },
  {
    versionKey: false,
  }
);

const MessageModel = model<Message>('Message', messageSchema);
export default MessageModel;
