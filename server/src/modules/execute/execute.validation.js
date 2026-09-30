import { z } from 'zod';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export const executeRequestSchema = z.object({
  method: z.enum(HTTP_METHODS, {
    message: `Method must be one of: ${HTTP_METHODS.join(', ')}`,
  }),

  url: z
    .string()
    .url({ message: 'URL must be a valid absolute URL, e.g. https://api.example.com' })
    .refine(
      (val) => {
        try {
          const parsed = new URL(val);
          return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
          return false;
        }
      },
      { message: 'Only http and https protocols are allowed.' }
    ),

  headers: z
    .record(z.string(), z.string())
    .optional()
    .default({}),

  body: z
    .string()
    .max(1_048_576, { message: 'Request body must not exceed 1 MB.' })
    .optional()
    .nullable()
    .default(null),
});
