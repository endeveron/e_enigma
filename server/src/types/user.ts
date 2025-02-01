import { ObjectId } from 'mongoose';

type UserAccount = {
  name: string;
  email: string;
  imageUrl?: string;
  password: string;
  role: {
    index: number;
    name: string;
  };
};

export type Statistics = {
  google: {};
  updTimestamp: number;
};

export type User = {
  _id: ObjectId;
  account: UserAccount;
  publicKey: string;
};

export type AuthData = {
  id: string;
  account: Omit<UserAccount, 'password'>;
};

export type UserItem = {
  id: string;
  name: string;
  imageUrl?: string;
};
