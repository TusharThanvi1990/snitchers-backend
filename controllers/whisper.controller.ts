import { Request, Response } from 'express';
import Whisper from '../models/Whisper.js';
import User from '../models/User.js';

// For typing purposes if needed later
interface AuthenticatedRequest extends Request {
  user?: any;
}

export const createWhisper = async (req: Request, res: Response) => {
  try {
    const { content, targetPerson, userId } = req.body;

    const newWhisper = new Whisper({
      user: userId, // In a real app, we'd get this from the JWT middleware
      content,
      targetPerson
    });

    await newWhisper.save();
    res.status(201).json(newWhisper);
  } catch (error) {
    console.error('Create Whisper Error:', error);
    res.status(500).json({ message: 'Error creating whisper' });
  }
};

export const getWhispers = async (req: Request, res: Response) => {
  try {
    const whispers = await Whisper.find()
      .populate('user', 'anonymousName college branch')
      .sort({ createdAt: -1 });
    res.json(whispers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching whispers' });
  }
};

export const likeWhisper = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isLiked = user.likedWhispers.some(wId => wId.toString() === id);
    let whisper;

    if (isLiked) {
      // Unlike
      user.likedWhispers = user.likedWhispers.filter(wId => wId.toString() !== id);
      whisper = await Whisper.findByIdAndUpdate(id, { $inc: { likesCount: -1 } }, { new: true });
    } else {
      // Like
      user.likedWhispers.push(id as any);
      whisper = await Whisper.findByIdAndUpdate(id, { $inc: { likesCount: 1 } }, { new: true });
    }

    await user.save();
    res.json({ whisper, user });
  } catch (error) {
    console.error('Like Toggle Error:', error);
    res.status(500).json({ message: 'Error toggling like' });
  }
};

export const addComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const whisper = await Whisper.findByIdAndUpdate(
      id,
      { 
        $push: { comments: { text } },
        $inc: { commentsCount: 1 }
      },
      { new: true }
    );
    res.json(whisper);
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment' });
  }
};

export const deleteWhisper = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const adminUser = req.user;

    const whisper = await Whisper.findById(id).populate('user');
    if (!whisper) {
      return res.status(404).json({ message: 'Whisper not found.' });
    }

    // Permission Check
    if (adminUser.role !== 'super_admin') {
      // Admin check: Must be from the same college
      const author = whisper.user as any;
      if (author.college !== adminUser.college) {
        return res.status(403).json({ message: 'Forbidden: You can only delete whispers from your organization.' });
      }
    }

    await Whisper.findByIdAndDelete(id);
    res.json({ message: 'Whisper removed from the shadows.' });
  } catch (error) {
    console.error('Delete Whisper Error:', error);
    res.status(500).json({ message: 'Error deleting whisper' });
  }
};

export const flagWhisper = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const adminUser = req.user;

    const whisper = await Whisper.findById(id).populate('user');
    if (!whisper) {
      return res.status(404).json({ message: 'Whisper not found.' });
    }

    // Permission Check
    if (adminUser.role !== 'super_admin') {
      // Admin check: Must be from the same college
      const author = whisper.user as any;
      if (author.college !== adminUser.college) {
        return res.status(403).json({ message: 'Forbidden: You can only flag whispers from your organization.' });
      }
    }

    const updatedWhisper = await Whisper.findByIdAndUpdate(
      id,
      { isFlagged: true },
      { new: true }
    );
    res.json({ message: 'Whisper has been flagged for moderation.', whisper: updatedWhisper });
  } catch (error) {
    console.error('Flag Whisper Error:', error);
    res.status(500).json({ message: 'Error flagging whisper' });
  }
};
