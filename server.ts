import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import whisperRoutes from './routes/whisper.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/snitchers';

// Track database connection status
let dbConnected = false;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint - shows database status
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    port: PORT,
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/whispers', whisperRoutes);

app.get('/', (req, res) => {
  res.send('Snitchers API is whispering...');
});

// Start server immediately
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
  console.log(`🔌 Attempting MongoDB connection...`);
  console.log(`📍 MONGO_URI: ${MONGO_URI ? MONGO_URI.substring(0, 50) + '...' : 'NOT SET'}`);
  connectToDatabase();
});

// Connect to MongoDB with timeout
async function connectToDatabase() {
  try {
    // Set connection timeout to 10 seconds
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    dbConnected = true;
    console.log('✅ Connected to the heart of the database (MongoDB)');
  } catch (err) {
    dbConnected = false;
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('❌ Database connection error:', errorMessage);
    console.error('⚠️  MONGO_URI:', MONGO_URI);
    console.error('⚠️  Retrying connection in 5 seconds...');
    
    // Retry connection every 5 seconds
    setTimeout(connectToDatabase, 5000);
  }
}
