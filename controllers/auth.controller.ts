import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { uniqueNamesGenerator, adjectives, animals, colors } from 'unique-names-generator';
import User from '../models/User.js';
import Whisper from '../models/Whisper.js';

const JWT_SECRET = process.env.JWT_SECRET || 'romantic-secret-key-123';

export const generateRandomName = () => {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: ' ',
    style: 'capital'
  });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { password, college, branch, interests, anonymousName: providedName } = req.body;

    const anonymousName = providedName || generateRandomName();

    // Check if name exists (highly unlikely with adjectives+colors+animals but good to check)
    const existingUser = await User.findOne({ anonymousName });
    if (existingUser) {
      return res.status(400).json({ message: 'This identity is already taken. Try another.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // First user becomes super_admin
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'super_admin' : 'user';

    const newUser = new User({
      anonymousName,
      passwordHash,
      college,
      branch,
      interests,
      role
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        _id: newUser._id,
        anonymousName: newUser.anonymousName,
        college: newUser.college,
        branch: newUser.branch,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { anonymousName, password } = req.body;

    const user = await User.findOne({ anonymousName });
    if (!user) {
      return res.status(400).json({ message: 'Shadow identity not found.' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ message: 'This identity has been suspended by the shadows.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        _id: user._id,
        anonymousName: user.anonymousName,
        college: user.college,
        branch: user.branch,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const getName = (req: Request, res: Response) => {
  const name = generateRandomName();
  res.json({ name });
};

export const deleteUser = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const adminUser = req.user;

    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Permission Check
    if (adminUser.role !== 'super_admin') {
      // Admin check: Must be from the same college
      if (userToDelete.college !== adminUser.college) {
        return res.status(403).json({ message: 'Forbidden: You can only delete users from your organization.' });
      }
      
      // Admins cannot delete other admins or super admins
      if (userToDelete.role === 'admin' || userToDelete.role === 'super_admin') {
        return res.status(403).json({ message: 'Forbidden: Admins cannot delete other administrative accounts.' });
      }
    }

    await User.findByIdAndDelete(id);
    res.json({ message: 'Identity has been erased from the shadows.' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
};

export const suspendUser = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const adminUser = req.user;

    // Only Super Admin can suspend currently based on requirements
    if (adminUser.role !== 'super_admin') {
      return res.status(403).json({ message: 'Forbidden: Only Super Admins can suspend identities.' });
    }

    const userToSuspend = await User.findById(id);
    if (!userToSuspend) {
      return res.status(404).json({ message: 'User not found.' });
    }

    userToSuspend.isSuspended = !userToSuspend.isSuspended;
    await userToSuspend.save();

    res.json({ 
      message: userToSuspend.isSuspended ? 'Identity has been suspended.' : 'Identity has been restored.',
      user: userToSuspend 
    });
  } catch (error) {
    console.error('Suspend User Error:', error);
    res.status(500).json({ message: 'Error toggling user suspension' });
  }
};

export const getStats = async (req: any, res: Response) => {
  try {
    const adminUser = req.user;

    if (adminUser.role === 'super_admin') {
      // Global Stats
      const totalWhispers = await Whisper.countDocuments();
      const totalUsers = await User.countDocuments();
      const totalAdmins = await User.countDocuments({ role: 'admin' });
      const totalFlagged = await Whisper.countDocuments({ isFlagged: true });
      const colleges = await User.distinct('college');

      return res.json({
        totalWhispers,
        totalUsers,
        totalAdmins,
        totalFlagged,
        totalColleges: colleges.length
      });
    } else if (adminUser.role === 'admin') {
      // College Specific Stats
      const college = adminUser.college;
      
      // Get all users in this college to filter whispers
      const collegeUsers = await User.find({ college }).select('_id');
      const userIds = collegeUsers.map(u => u._id);

      const totalWhispers = await Whisper.countDocuments({ user: { $in: userIds } });
      const totalUsers = collegeUsers.length;
      const totalFlagged = await Whisper.countDocuments({ user: { $in: userIds }, isFlagged: true });

      return res.json({
        totalWhispers,
        totalUsers,
        totalFlagged,
        college
      });
    }

    res.status(403).json({ message: 'Forbidden: Insufficient permissions for stats.' });
  } catch (error) {
    console.error('Get Stats Error:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
};
