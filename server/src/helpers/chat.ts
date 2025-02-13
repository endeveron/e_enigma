import MessageModel from '../models/message';
import { EncryptedMessage, RoomItem } from '../types/chat';
import { UserItem } from '../types/user';
import logger from './logger';

export const getRoomMemberId = (room: any, userId: string): string | null => {
  const memberIdArr = room.members.map((m: any) => m._id.toString());
  const filteredIdArr = memberIdArr.filter((id: string) => id !== userId);
  return filteredIdArr.length ? filteredIdArr[0] : null;
};

export const configureRoomItems = async (
  rooms: any[],
  userId: string
): Promise<RoomItem[]> => {
  const roomItems: RoomItem[] = [];

  for (let r of rooms) {
    // Count the unread (new) messages
    const newMsgCount = await MessageModel.countDocuments({
      roomId: r._id,
      recipientId: userId,
      viewedAt: undefined,
    });

    const memberId = getRoomMemberId(r, userId);
    if (!memberId) {
      logger.r('configureRoomItems: Unable to get memberId');
      return [];
    }

    roomItems.push({
      id: r._id.toString(),
      memberId,
      newMsgCount,
      updatedAt: new Date(r.updatedAt).getTime(),
    });
  }

  return roomItems;
};

export const parseInvitations = (docs: any[]): UserItem[] => {
  if (!docs.length) return [];
  return docs.map((doc: any) => {
    const data = doc.from || doc.to;
    return {
      id: data._id.toString(),
      name: data.account.name,
      imageUrl: data.account.imageUrl,
    };
  });
};

export const parseMessages = (messages: any): EncryptedMessage[] => {
  return messages.map((m: any) => ({
    id: m._id.toString(),
    roomId: m.roomId.toString(),
    senderId: m.senderId.toString(),
    recipientId: m.recipientId.toString(),
    data: m.data,
    createdAt: m.createdAt,
    recievedAt: m.recievedAt,
    viewedAt: m.viewedAt,
    systemCode: m.systemCode,
  }));
};
