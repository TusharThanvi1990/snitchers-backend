import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { uniqueNamesGenerator, adjectives, animals, colors } from 'unique-names-generator';
import User from '../models/User.js';

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

    const newUser = new User({
      anonymousName,
      passwordHash,
      college,
      branch,
      interests
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        _id: newUser._id,
        anonymousName: newUser.anonymousName,
        college: newUser.college,
        branch: newUser.branch
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

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        _id: user._id,
        anonymousName: user.anonymousName,
        college: user.college,
        branch: user.branch
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
