const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

async function setup() {
  try {
    console.log('Connecting to Atlas...');
    await mongoose.connect(MONGO_URI);
    
    // Find the college of the first whisper
    // Since we don't have the Whisper model here, we'll use a raw collection query
    const whispersCollection = mongoose.connection.collection('whispers');
    const usersCollection = mongoose.connection.collection('users');
    
    const firstWhisper = await whispersCollection.findOne({});
    let targetCollege = 'Imperial College of Shadows';
    
    if (firstWhisper && firstWhisper.user) {
      const userOfWhisper = await usersCollection.findOne({ _id: firstWhisper.user });
      if (userOfWhisper && userOfWhisper.college) {
        targetCollege = userOfWhisper.college;
      }
    }
    
    console.log(`Targeting college: "${targetCollege}"`);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);
    
    await usersCollection.updateOne(
      { anonymousName: 'Boring Peach Smelt' },
      { 
        $set: { 
          role: 'admin', 
          college: targetCollege,
          passwordHash: passwordHash
        }
      }
    );
    
    console.log(`Updated Boring Peach Smelt to admin for college: ${targetCollege} with password: password123`);
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

setup();
