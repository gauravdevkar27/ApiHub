import { Router } from 'express';
import { executeRequest } from './execute.controller.js';
import { executeRequestSchema } from './execute.validation.js';
import validate from '../../middleware/validate.js';
import authenticate from '../../middleware/authenticate.js';
import { executeLimiter } from '../../middleware/rateLimiters.js';

const router = Router();

router.use(authenticate, executeLimiter);

router.post('/', validate(executeRequestSchema), executeRequest);

export default router;
