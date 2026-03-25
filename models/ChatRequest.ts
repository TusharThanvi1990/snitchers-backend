import mongoose, { Schema, Document } from 'mongoose';

export interface IChatRequest extends Document {
  from: mongoose.Types.ObjectId;
  to: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'ignored';
  fromName: string;
  createdAt: Date;
}

const ChatRequestSchema: Schema = new Schema({
  from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fromName: { type: String, required: true }, // Store name for easy display
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'ignored'], 
    default: 'pending' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    index: { expires: '24h' } // TTL Index: Auto-delete after 24 hours
  }
});

export default mongoose.model<IChatRequest>('ChatRequest', ChatRequestSchema);
