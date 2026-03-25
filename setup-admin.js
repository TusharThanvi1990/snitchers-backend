import mongoose from 'mongoose';
import User from './models/User.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the same directory
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI not found in .env');
  process.exit(1);
}

async function setupAdmin() {
  try {
    console.log('Connecting to Atlas...');
    await mongoose.connect(MONGO_URI);
    
    // Find ANY user to promote if we don't know the name yet, or use the one we saw in some records
    const users = await User.find({});
    if (users.length === 0) {
      console.log('No users found in Atlas. Please register first.');
      await mongoose.disconnect();
      return;
    }

    const admin = users[0]; // Promote the first user
    const salt = await bcrypt.genSalt(10);
    admin.passwordHash = await bcrypt.hash('password123', salt);
    admin.role = 'super_admin';
    await admin.save();
    
    console.log(`Updated ${admin.anonymousName} to super_admin with password: password123`);
    console.log(`Identity to use for login: "${admin.anonymousName}"`);
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

setupAdmin();
