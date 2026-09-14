import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import collectionRoutes from '../modules/collection/collection.routes.js';
import requestRoutes from '../modules/request/request.routes.js';

const router = Router();

// Auth module
router.use('/v1/auth', authRoutes);

// Collections module
router.use('/v1/collections', collectionRoutes);

// Requests module (handles both nested and direct routes)
router.use('/v1', requestRoutes);

export default router;

