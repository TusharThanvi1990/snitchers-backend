import { Router } from 'express';
import { register, login, getName } from '../controllers/auth.controller.js';
const router = Router();
router.post('/register', register);
router.post('/login', login);
router.get('/generate-name', getName);
export default router;
