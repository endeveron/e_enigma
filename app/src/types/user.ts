import { UserItem } from '@/types/chat';

export type InvitationType = 'sent' | 'recieved';

export type InvitatoionMapItem = Omit<UserItem, 'id'>;
