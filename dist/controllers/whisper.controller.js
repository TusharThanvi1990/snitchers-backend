import Whisper from '../models/Whisper.js';
import User from '../models/User.js';
export const createWhisper = async (req, res) => {
    try {
        const { content, targetPerson, userId } = req.body;
        const newWhisper = new Whisper({
            user: userId, // In a real app, we'd get this from the JWT middleware
            content,
            targetPerson
        });
        await newWhisper.save();
        res.status(201).json(newWhisper);
    }
    catch (error) {
        console.error('Create Whisper Error:', error);
        res.status(500).json({ message: 'Error creating whisper' });
    }
};
export const getWhispers = async (req, res) => {
    try {
        const whispers = await Whisper.find()
            .populate('user', 'anonymousName college branch')
            .sort({ createdAt: -1 });
        res.json(whispers);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching whispers' });
    }
};
export const likeWhisper = async (req, res) => {
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
        const isLiked = user.likedWhispers.includes(id);
        let whisper;
        if (isLiked) {
            // Unlike
            user.likedWhispers = user.likedWhispers.filter(wId => wId.toString() !== id);
            whisper = await Whisper.findByIdAndUpdate(id, { $inc: { likesCount: -1 } }, { new: true });
        }
        else {
            // Like
            user.likedWhispers.push(id);
            whisper = await Whisper.findByIdAndUpdate(id, { $inc: { likesCount: 1 } }, { new: true });
        }
        await user.save();
        res.json({ whisper, user });
    }
    catch (error) {
        console.error('Like Toggle Error:', error);
        res.status(500).json({ message: 'Error toggling like' });
    }
};
export const addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        const whisper = await Whisper.findByIdAndUpdate(id, {
            $push: { comments: { text } },
            $inc: { commentsCount: 1 }
        }, { new: true });
        res.json(whisper);
    }
    catch (error) {
        res.status(500).json({ message: 'Error adding comment' });
    }
};
