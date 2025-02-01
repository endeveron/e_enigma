import { Schema, model } from 'mongoose';

import { User } from '../types/user';

const userSchema = new Schema<User>(
  {
    account: {
      name: {
        type: String,
        required: [true, 'User name is required'],
        minlength: [2, 'User name cannot contain less than 2 characters'],
        maxlength: [20, 'User name cannot contain more than 20 characters'],
      },
      email: {
        type: String,
        required: [true, 'User email is required'],
      },
      imageUrl: {
        type: String,
      },
      password: {
        minlength: [6, 'Password cannot contain less than 6 characters'],
        type: String,
        required: [true, 'Password is required'],
      },
      role: {
        index: {
          type: Number,
          required: [true, 'User role index is required'],
        },
        name: {
          type: String,
          required: [true, 'User role name is required'],
        },
      },
    },
    publicKey: {
      type: String,
      required: [true, 'Public key is required'],
    },
  },
  {
    versionKey: false,
  }
);

const UserModel = model<User>('User', userSchema);
export default UserModel;
