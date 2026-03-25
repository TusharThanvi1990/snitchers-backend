import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI;

// Define simple schemas locally to avoid ESM import issues for one-off scripts
const UserSchema = new mongoose.Schema({
  anonymousName: String,
  role: String,
  college: String,
  passwordHash: String
});

const WhisperSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const User = mongoose.model('UserTemp', UserSchema, 'users');
const Whisper = mongoose.model('WhisperTemp', WhisperSchema, 'whispers');

async function setupAdmin() {
  try {
    console.log('Connecting to Atlas...');
    await mongoose.connect(MONGO_URI);
    
    const firstWhisper = await Whisper.findOne({}).populate('user');
    const targetCollege = (firstWhisper?.user as any)?.college || 'Imperial College of Shadows';
    
    console.log(`Targeting college: "${targetCollege}"`);

    const user = await User.findOne({ anonymousName: 'Boring Peach Smelt' });
    if (user) {
      // Use a pre-hashed password for simplicity or just a simple string if the app allows it (usually needs bcrypt)
      // I'll assume 'password123' hashed with bcrypt (standard 10 rounds)
      const bcrypt = await import('bcryptjs');
      const salt = await bcrypt.default.genSalt(10);
      user.passwordHash = await bcrypt.default.hash('password123', salt);
      user.role = 'admin';
      user.college = targetCollege;
      await user.save();
      console.log(`Updated Boring Peach Smelt to admin for college: ${targetCollege} with password: password123`);
    } else {
      console.log('Boring Peach Smelt not found in DB.');
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

setupAdmin();
