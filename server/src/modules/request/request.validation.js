import { z } from 'zod';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export const createRequestSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Request name is required.' })
    .max(200, { message: 'Request name must be 200 characters or fewer.' }),

  method: z
    .enum(HTTP_METHODS, { message: `Method must be one of: ${HTTP_METHODS.join(', ')}` })
    .optional()
    .default('GET'),

  url: z
    .string()
    .optional()
    .default(''),

  headers: z
    .string()
    .optional()
    .nullable(),

  body: z
    .string()
    .optional()
    .nullable(),

  position: z
    .number()
    .int({ message: 'Position must be an integer.' })
    .min(0, { message: 'Position must be 0 or greater.' })
    .optional(),
});

export const updateRequestSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Request name is required.' })
    .max(200, { message: 'Request name must be 200 characters or fewer.' })
    .optional(),

  method: z
    .enum(HTTP_METHODS, { message: `Method must be one of: ${HTTP_METHODS.join(', ')}` })
    .optional(),

  url: z
    .string()
    .optional(),

  headers: z
    .string()
    .optional()
    .nullable(),

  body: z
    .string()
    .optional()
    .nullable(),

  position: z
    .number()
    .int({ message: 'Position must be an integer.' })
    .min(0, { message: 'Position must be 0 or greater.' })
    .optional(),
});
