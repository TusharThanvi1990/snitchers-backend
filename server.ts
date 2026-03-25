import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.routes.js';
import whisperRoutes from './routes/whisper.routes.js';
import chatRoutes from './routes/chat.routes.js';
import userRoutes from './routes/user.routes.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://snitchers:Bbsmw_ZCEx64zC7@snitchers.vrqhr0v.mongodb.net/?appName=snitchers';

let dbConnected = false;

const userSocketMap = new Map<string, string>();

import PendingMessage from './models/PendingMessage.js';

io.on('connection', (socket) => {
  console.log('A soul connected:', socket.id);

  socket.on('register', async (userId: string) => {
    userSocketMap.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);

    try {
      const pendingMsgs = await PendingMessage.find({ to: userId }).sort({ timestamp: 1 });
      if (pendingMsgs.length > 0) {
        for (const msg of pendingMsgs) {
          socket.emit('receive_private_message', {
            fromUserId: msg.from,
            message: msg.content,
            timestamp: msg.timestamp
          });
        }
        await PendingMessage.deleteMany({ to: userId });
      }
    } catch (error) {
      console.error('Error syncing pending messages:', error);
    }
  });

  socket.on('send_chat_request', ({ fromUserId, toUserId, fromName }) => {
    const targetSocketId = userSocketMap.get(toUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('receive_chat_request', { fromUserId, fromName, requestId: Math.random().toString(36).substring(7) });
    }
  });

  socket.on('accept_chat_request', ({ fromUserId, toUserId, toName }) => {
    const targetSocketId = userSocketMap.get(fromUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('chat_request_accepted', { withUserId: toUserId, withName: toName });
    }
  });

  socket.on('send_private_message', async ({ toUserId, message, fromUserId }) => {
    const targetSocketId = userSocketMap.get(toUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('receive_private_message', { fromUserId, message, timestamp: new Date().toISOString() });
    } else {
      try {
        const pending = new PendingMessage({ from: fromUserId, to: toUserId, content: message });
        await pending.save();
      } catch (error) {
        console.error('Error saving pending message:', error);
      }
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        break;
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    port: PORT,
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint
app.get('/debug/sockets', (req, res) => {
  res.json(Object.fromEntries(userSocketMap));
});

// Routes
app.get('/api/ping', (req, res) => res.json({ msg: 'Global API Ping OK' }));
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/whispers', whisperRoutes);
app.get('/api/users/ping', (req, res) => res.json({ msg: 'Users Route Ping OK' }));
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('Snitchers API is whispering...');
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server (HTTP + WS) is listening on port ${PORT}`);
  connectToDatabase();
});

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    dbConnected = true;
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    setTimeout(connectToDatabase, 5000);
  }
}
