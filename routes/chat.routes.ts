import { Router } from 'express';
import { sendRequest, getRequests, acceptRequest, getActiveChats, closeChat } from '../controllers/chat.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/request', protect, sendRequest);
router.get('/requests', protect, getRequests);
router.post('/accept/:requestId', protect, acceptRequest);
router.get('/active', protect, getActiveChats);
router.post('/close', protect, closeChat);

export default router;
