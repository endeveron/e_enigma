import { Schema } from 'mongoose';

import { UserItem } from './user';

// Room

export type Room = {
  members: Schema.Types.ObjectId[];
  encryption: {
    prime: string;
    generator: string;
  };
  createdAt: Date;
  updatedAt: Date;
};

export type RoomMember = {
  id: string;
  name: string;
  publicKey: string;
  imageUrl?: string;
};

export type RoomItem = {
  id: string;
  // members: string[];
  memberId: string;
  newMsgCount: number;
  updatedAt: number;
};

// Message

export enum MessageType {
  text = 'text',
  image = 'image',
  audio = 'audio',
}

export type MessageEventData = {
  roomId: string;
  messageId: string;
  senderId: string;
  recipientId: string;
  createdAt: number;
  recievedAt?: number;
  viewedAt?: number;
};

export type Message = {
  _id: Schema.Types.ObjectId;
  roomId: Schema.Types.ObjectId;
  senderId: Schema.Types.ObjectId;
  recipientId: Schema.Types.ObjectId;
  data: string; // encrypted: data, type, date
  createdAt: number;
  recievedAt?: number;
  viewedAt?: number;
  systemCode?: string;
};

export type EncryptedMessage = Omit<
  Message,
  '_id' | 'roomId' | 'senderId' | 'recipientId'
> & {
  id: string;
  roomId: string;
  senderId: string;
  recipientId: string;
};

export type MessageMetadataItem = {
  createdAt: number;
  id?: string;
  recievedAt?: number;
  viewedAt?: number;
};

// Invitation

export type Invitation = {
  from: Schema.Types.ObjectId;
  to: Schema.Types.ObjectId;
  timestamp: number;
};

export type InvitationGroup = {
  sent: UserItem[];
  recieved: UserItem[];
};

// export type InvitationOfferData = {
//   invitedUserId: string;
//   roomCreator: UserItem;
// };

export type InvitationAnswerData = {
  event: 'accepted' | 'rejected';
  from: string;
  to: string;
};

export enum SystemMessageCode {
  E001 = 'E001', // Encryption keys are changed
}
