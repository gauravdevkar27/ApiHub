import { Router } from 'express';
import { executeRequest } from './execute.controller.js';
import { executeRequestSchema } from './execute.validation.js';
import validate from '../../middleware/validate.js';

const router = Router();

router.post('/', validate(executeRequestSchema), executeRequest);

export default router;
