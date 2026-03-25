import { Response } from 'express';
import ChatRequest from '../models/ChatRequest.js';
import User from '../models/User.js';

export const sendRequest = async (req: any, res: Response) => {
  try {
    const { toUserId, fromName } = req.body;
    const fromUserId = req.user._id;

    if (fromUserId.toString() === toUserId) {
      return res.status(400).json({ message: "You cannot whisper to yourself in the shadows." });
    }

    // Check if a request already exists
    const existingRequest = await ChatRequest.findOne({
      from: fromUserId,
      to: toUserId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: "A request is already pending in the shadows." });
    }

    const newRequest = new ChatRequest({
      from: fromUserId,
      to: toUserId,
      fromName: fromName || "Anonymous Soul",
      status: 'pending'
    });

    await newRequest.save();

    // Optionally: if the user is online, the socket server will pick this up 
    // and notify them. We'll handle that via a 'new_request' signal if needed.

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Send Request Error:', error);
    res.status(500).json({ message: 'Error sending chat request' });
  }
};

export const getRequests = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const requests = await ChatRequest.find({
      to: userId,
      status: 'pending'
    }).sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching requests' });
  }
};

export const acceptRequest = async (req: any, res: Response) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await ChatRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found or expired.' });
    }

    if (request.to.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    request.status = 'accepted';
    await request.save();

    // Add to activeChats for both users
    await User.findByIdAndUpdate(request.from, { $addToSet: { activeChats: request.to } });
    await User.findByIdAndUpdate(request.to, { $addToSet: { activeChats: request.from } });

    res.json({ message: 'Request accepted.', request });
  } catch (error) {
    res.status(500).json({ message: 'Error accepting request' });
  }
};

export const getActiveChats = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate('activeChats', 'anonymousName college branch');
    res.json(user?.activeChats || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active chats' });
  }
};

export const closeChat = async (req: any, res: Response) => {
  try {
    const { partnerId } = req.body;
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, { $pull: { activeChats: partnerId } });
    // Note: We only remove it for the closer. The other person can still have it active 
    // until they close it or see it's gone.
    
    res.json({ message: 'Chat closed.' });
  } catch (error) {
    res.status(500).json({ message: 'Error closing chat' });
  }
};
