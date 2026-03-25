import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/snitchers';

async function checkUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    const users = await User.find({}, 'anonymousName role isSuspended');
    console.log('--- Current Users ---');
    users.forEach(u => {
      console.log(`Name: ${u.anonymousName}, Role: ${u.role}, Suspended: ${u.isSuspended}`);
    });
    
    if (users.length > 0) {
      // Promote the first user to super_admin if no super_admin exists
      const hasSuperAdmin = users.some(u => u.role === 'super_admin');
      if (!hasSuperAdmin) {
        users[0].role = 'super_admin';
        await users[0].save();
        console.log(`\nPROMOTED ${users[0].anonymousName} to super_admin for testing.`);
      }
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkUsers();
