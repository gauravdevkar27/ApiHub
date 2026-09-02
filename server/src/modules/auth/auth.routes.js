import { Router } from 'express';
import { signup, login, getMe } from './auth.controller.js';
import authenticate from '../../middleware/authenticate.js';

const router = Router();

// Public routes
router.post('/signup', signup);
router.get('/login', login);

// Protected routes
router.get('/me', authenticate, getMe);

export default router;
