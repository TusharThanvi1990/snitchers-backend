import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js'; // Keep .js as per TS ESM conventions if configured, but let's see

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/snitchers';

async function test() {
  try {
    console.log('Connecting to:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    const count = await User.countDocuments();
    console.log('Total users:', count);
    
    const users = await User.find({});
    console.log('Users found:', users.length);
    users.forEach(u => {
      console.log(`- ${u.anonymousName} (${u.role})`);
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
