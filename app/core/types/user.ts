import { UserItem } from '@/core/types/chat';

export type InvitationType = 'sent' | 'recieved';

export type InvitatoionMapItem = Omit<UserItem, 'id'>;
