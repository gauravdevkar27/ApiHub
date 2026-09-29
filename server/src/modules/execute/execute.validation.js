import { z } from 'zod';

export const executeRequestSchema = z.object({
    method: z.enum(["GET"]),
    url: z.string().url({message: "url must be valid absolute URL, e.g. https://api.example.com"}),

});
