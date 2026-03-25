import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/snitchers';

async function debugUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    const users = await User.find({});
    console.log('--- DB Debug ---');
    users.forEach(u => {
      console.log(JSON.stringify({
        name: u.anonymousName,
        role: u.role,
        isSuspended: u.isSuspended
      }, null, 2));
    });
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

debugUsers();
