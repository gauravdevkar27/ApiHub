import { Router } from 'express';
import {
  createCollection,
  listCollections,
  getCollection,
  updateCollection,
  deleteCollection,
} from './collection.controller.js';
import { createCollectionSchema, updateCollectionSchema } from './collection.validation.js';
import validate from '../../middleware/validate.js';
import authenticate from '../../middleware/authenticate.js';

const router = Router();

// All collection routes require authentication
router.use(authenticate);

router.post('/', validate(createCollectionSchema), createCollection);
router.get('/', listCollections);
router.get('/:id', getCollection);
router.patch('/:id', validate(updateCollectionSchema), updateCollection);
router.delete('/:id', deleteCollection);

export default router;
