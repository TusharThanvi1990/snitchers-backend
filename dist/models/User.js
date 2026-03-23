import mongoose, { Schema } from 'mongoose';
const UserSchema = new Schema({
    anonymousName: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    college: { type: String, required: true },
    branch: { type: String, required: true },
    interests: { type: [String], default: [] },
    likedWhispers: [{ type: Schema.Types.ObjectId, ref: 'Whisper', default: [] }],
    createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('User', UserSchema);
