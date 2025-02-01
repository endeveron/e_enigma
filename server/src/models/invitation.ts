import { Schema, model } from 'mongoose';

import { Invitation } from '../types/chat';

const invitationSchema = new Schema<Invitation>(
  {
    from: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    timestamp: { type: Number },
  },
  {
    versionKey: false,
  }
);

const InvitationModel = model<Invitation>('Invitation', invitationSchema);
export default InvitationModel;
