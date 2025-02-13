// Invitation

export type InvitationType = 'sent' | 'recieved';

export type InvitatoionMapItem = Omit<UserItem, 'id'>;

export type InvitationData = {
  roomCreatorId: string;
  invitedUserId: string;
};

export type InvitationOfferData = {
  invitedUserId: string;
  roomCreator: UserItem;
};

export type InvitationAnswerData = {
  event: 'accepted' | 'rejected';
  from: string;
  to: string;
};

// User

export type UserItem = {
  id: string;
  name: string;
  imageUrl?: string;
};

export type UserItemExt = UserItem & {
  isInvite: boolean;
};

// Room

export type RoomMember = {
  id: string;
  name: string;
  publicKey: string;
  imageUrl?: string;
};

export type RoomMemberMapItem = Omit<RoomMember, 'id'>;

export type RoomItem = {
  id: string;
  memberId: string;
  newMsgCount: number;
  updatedAt: number;
};

export type LocalDBRoom = Omit<RoomItem, 'newMsgCount'> & {};

// Message

export enum MessageType {
  text = 'text',
  image = 'image',
  audio = 'audio',
}

export type MessageDate = {
  day: string; // YYYY-MM-DD
  time: string; // hh:mm
};

export type EncryptedMessage = {
  id: string;
  roomId: string;
  senderId: string;
  recipientId: string;
  data: string; // encrypted data
  createdAt: number; // timestamp
  recievedAt?: number; // timestamp
  viewedAt?: number; // timestamp
  systemCode?: string;
};

export type CreateMessageReqData = {
  roomId: string;
  senderId: string;
  data: string;
  createdAt: number;
};

export type DecryptedMessageData = {
  data: string;
  type: string;
  date: MessageDate;
};

export type Message = EncryptedMessage & Omit<DecryptedMessageData, 'data'>;

export type MessageItem = Omit<Message, 'senderId'> & {
  senderId: string;
  recipientId: string;
  type: string; // MessageType
  date: MessageDate;
  createdAt: number; // timestamp
  recievedAt?: number;
  viewedAt?: number;
};

export type LocalDBMessage = Omit<
  MessageItem,
  'date' | 'recipient' | 'sender' | 'userId'
> & {
  day: string;
  time: string;
  senderId: string;
  recipientId: string;
  recievedAt: number;
  viewedAt: number;
};

export type MessageMetadataItem = {
  createdAt: number;
  id?: string;
  recievedAt?: number;
  viewedAt?: number;
};

export type MessageEventData = {
  roomId: string;
  messageId: string;
  senderId: string;
  recipientId: string;
  createdAt: number;
  recievedAt?: number;
  viewedAt?: number;
};

export enum SystemMessageCode {
  E001 = 'E001', // Encryption keys are changed
}
