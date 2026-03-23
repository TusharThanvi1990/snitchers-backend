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
// Middleware
app.use(cors());
app.use(express.json());
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
});
// Connect to MongoDB asynchronously
mongoose.connect(MONGO_URI)
    .then(() => {
    console.log('✅ Connected to the heart of the database (MongoDB)');
})
    .catch((err) => {
    console.error('❌ Database connection error:', err.message);
    console.error('⚠️  MONGO_URI:', MONGO_URI);
});
