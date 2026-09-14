import { Router } from 'express';
import {
  createRequest,
  listRequests,
  getRequest,
  updateRequest,
  deleteRequest,
} from './request.controller.js';
import { createRequestSchema, updateRequestSchema } from './request.validation.js';
import validate from '../../middleware/validate.js';
import authenticate from '../../middleware/authenticate.js';

const router = Router();

// All request routes require authentication
router.use(authenticate);

// Nested under /collections/:collectionId/requests
router.post('/collections/:collectionId/requests', validate(createRequestSchema), createRequest);
router.get('/collections/:collectionId/requests', listRequests);

// Direct request access by ID
router.get('/requests/:id', getRequest);
router.patch('/requests/:id', validate(updateRequestSchema), updateRequest);
router.delete('/requests/:id', deleteRequest);

export default router;
