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
// Connect to MongoDB
mongoose.connect(MONGO_URI)
    .then(() => {
    console.log('Connected to the heart of the database (MongoDB)');
    startServer();
})
    .catch((err) => {
    console.error('Database connection error:', err.message);
    console.error('MONGO_URI:', MONGO_URI);
    process.exit(1);
});
// Start the server
function startServer() {
    app.listen(PORT, () => {
        console.log(`Server is listening on port ${PORT}`);
    });
}
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
