import { Router } from 'express';
import { register, login, getName, deleteUser, suspendUser, getStats } from '../controllers/auth.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/generate-name', getName);
router.post('/register', register);
router.post('/login', login);

// Admin Routes
router.get('/admin/stats', protect, authorize('admin', 'super_admin'), getStats);
router.delete('/users/:id', protect, authorize('admin', 'super_admin'), deleteUser);
router.patch('/users/:id/suspend', protect, authorize('super_admin'), suspendUser);

export default router;
