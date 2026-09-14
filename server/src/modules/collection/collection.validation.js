import { z } from 'zod';
//collection validation schema

export const createCollectionSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Collection name is required.' })
    .max(100, { message: 'Collection name must be 100 characters or fewer.' }),

  parentId: z
    .string()
    .uuid({ message: 'parentId must be a valid UUID.' })
    .nullable()
    .optional(),

  position: z
    .number()
    .int({ message: 'Position must be an integer.' })
    .min(0, { message: 'Position must be 0 or greater.' })
    .optional(),
});

export const updateCollectionSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Collection name is required.' })
    .max(100, { message: 'Collection name must be 100 characters or fewer.' })
    .optional(),

  parentId: z
    .string()
    .uuid({ message: 'parentId must be a valid UUID.' })
    .nullable()
    .optional(),

  position: z
    .number()
    .int({ message: 'Position must be an integer.' })
    .min(0, { message: 'Position must be 0 or greater.' })
    .optional(),
});
