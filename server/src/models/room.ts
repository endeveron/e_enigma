import { Schema, model } from 'mongoose';

import { Room } from '../types/chat';

const roomSchema = new Schema<Room>(
  {
    members: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const RoomModel = model<Room>('Room', roomSchema);
export default RoomModel;
