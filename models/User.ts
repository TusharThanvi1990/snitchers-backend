import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  anonymousName: string;
  passwordHash: string;
  college: string;
  branch: string;
  interests: string[];
  role: 'user' | 'admin' | 'super_admin';
  isSuspended: boolean;
  likedWhispers: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  anonymousName: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  college: { type: String, required: true },
  branch: { type: String, required: true },
  interests: { type: [String], default: [] },
  role: { type: String, enum: ['user', 'admin', 'super_admin'], default: 'user' },
  isSuspended: { type: Boolean, default: false },
  likedWhispers: [{ type: Schema.Types.ObjectId, ref: 'Whisper', default: [] }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', UserSchema);
