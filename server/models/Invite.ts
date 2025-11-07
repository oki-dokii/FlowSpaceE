import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IInvite extends Document {
  boardId: Types.ObjectId;
  invitedBy: Types.ObjectId;
  email: string;
  token: string;
  role: 'editor' | 'viewer';
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InviteSchema = new Schema<IInvite>(
  {
    boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    role: { type: String, enum: ['editor', 'viewer'], default: 'editor' },
    status: { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Index for faster lookups
InviteSchema.index({ token: 1 });
InviteSchema.index({ boardId: 1, email: 1 });

export const Invite =
  mongoose.models.Invite || mongoose.model<IInvite>('Invite', InviteSchema);
