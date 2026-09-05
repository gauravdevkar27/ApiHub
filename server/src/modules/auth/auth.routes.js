import { Router } from 'express';
import { signup, login, getMe } from './auth.controller.js';
import { signupSchema, loginSchema } from './auth.validation.js';
import validate from '../../middleware/validate.js';
import authenticate from '../../middleware/authenticate.js';

const router = Router();

// Public routes
router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);

// Protected routes
router.get('/me', authenticate, getMe);

export default router;
