import mongoose, { Schema, Document } from 'mongoose';

export interface IComment {
  text: string;
  createdAt: Date;
}

export interface IWhisper extends Document {
  user: mongoose.Types.ObjectId;
  content: string;
  targetPerson?: string;
  likesCount: number;
  comments: IComment[];
  commentsCount: number;
  isFlagged: boolean;
  createdAt: Date;
}

const WhisperSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  targetPerson: { type: String, default: '' },
  likesCount: { type: Number, default: 0 },
  comments: [
    {
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  commentsCount: { type: Number, default: 0 },
  isFlagged: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IWhisper>('Whisper', WhisperSchema);
