import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';

const router = Router();

// Auth module
router.use('/v1/auth', authRoutes);

// Future modules will be added here:
// router.use('/v1/collections', collectionRoutes);
// router.use('/v1/requests', requestRoutes);
// router.use('/v1/history', historyRoutes);
// router.use('/v1/environments', environmentRoutes);

export default router;
