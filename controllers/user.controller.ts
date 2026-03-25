import { Response } from 'express';
import User from '../models/User.js';

export const getUsers = async (req: any, res: Response) => {
  try {
    const currentUserId = req.user._id;
    // Fetch users excluding the current user and sensitive fields
    const users = await User.find({ 
      _id: { $ne: currentUserId },
      isSuspended: false
    })
    .select('anonymousName college branch interests createdAt')
    .sort({ createdAt: -1 })
    .limit(50); // Initial limit, can add pagination later

    res.json(users);
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ message: 'Error fetching users from the shadows.' });
  }
};
