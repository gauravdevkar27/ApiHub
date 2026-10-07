import { Router } from 'express';
import { signup, login, refresh, logoutHandler, logoutAllHandler, getMe } from './auth.controller.js';
import { signupSchema, loginSchema } from './auth.validation.js';
import validate from '../../middleware/validate.js';
import authenticate from '../../middleware/authenticate.js';
import { loginLimiter,signupLimiter } from '../../middleware/rateLimiters.js';

const router = Router();

// Public routes
router.post('/signup', signupLimiter, validate(signupSchema), signup);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logoutHandler);

// Protected routes
router.get('/me', authenticate, getMe);
router.post('/logout-all', authenticate, logoutAllHandler);

export default router;
