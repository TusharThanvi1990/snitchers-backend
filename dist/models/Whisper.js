import mongoose, { Schema } from 'mongoose';
const WhisperSchema = new Schema({
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
    createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('Whisper', WhisperSchema);
