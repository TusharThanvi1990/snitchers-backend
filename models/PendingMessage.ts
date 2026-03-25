import mongoose, { Schema, Document } from 'mongoose';

export interface IPendingMessage extends Document {
  from: mongoose.Types.ObjectId;
  to: mongoose.Types.ObjectId;
  content: string;
  timestamp: Date;
}

const PendingMessageSchema: Schema = new Schema({
  from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// We don't necessarily need a TTL index here because we'll delete them manually 
// as soon as they are delivered. But we could add one (e.g. 7 days) just in case.
PendingMessageSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 }); // 7 days fallback

export default mongoose.model<IPendingMessage>('PendingMessage', PendingMessageSchema);
