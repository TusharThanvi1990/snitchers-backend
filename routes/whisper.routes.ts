import { Router } from 'express';
import { createWhisper, getWhispers, likeWhisper, addComment } from '../controllers/whisper.controller';

const router = Router();

router.post('/', createWhisper);
router.get('/', getWhispers);
router.patch('/:id/like', likeWhisper);
router.post('/:id/comment', addComment);

export default router;
