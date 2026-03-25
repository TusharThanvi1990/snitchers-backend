import { Router } from 'express';
import { createWhisper, getWhispers, likeWhisper, addComment, deleteWhisper, flagWhisper } from '../controllers/whisper.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', getWhispers);
router.post('/', createWhisper);
router.patch('/:id/like', likeWhisper);
router.post('/:id/comment', addComment);

// Admin Routes
router.delete('/:id', protect, authorize('admin', 'super_admin'), deleteWhisper);
router.patch('/:id/flag', protect, authorize('admin', 'super_admin'), flagWhisper);

export default router;
