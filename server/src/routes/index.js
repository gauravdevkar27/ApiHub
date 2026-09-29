import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import collectionRoutes from '../modules/collection/collection.routes.js';
import requestRoutes from '../modules/request/request.routes.js';
import executeRoutes from '../modules/execute/execute.routes.js';

const router = Router();

router.use('/v1/auth', authRoutes);
router.use('/v1/collections', collectionRoutes);
router.use('/v1', requestRoutes);
router.use('/v1/execute', executeRoutes);

export default router;

