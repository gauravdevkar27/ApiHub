import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({

    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),

    DATABASE_URL: z.string().min(1, 'Database url is required'),

    JWT_SECRET: z.string().min(1, 'JWT SECRET is required'),
    ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
    REFRESH_TOKEN_EXPIRES_DAYS: z.coerce.number().int().positive().default(7),

    CLIENT_URL: z.url().default('http://localhost:5173'),

    ALLOW_PRIVATE_NETWORKS: z.enum(['true', 'false']).default('false'),

    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),

    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

})
    .superRefine((val, ctx) => {
        if (val.NODE_ENV !== 'production') return;

        if (val.JWT_SECRET.length < 32) {
            ctx.addIssue({
                code: 'custom',
                path: ['JWT_SECRET'],
                message: 'must be least 32 characters in production',

            });
        }

        if (val.ALLOW_PRIVATE_NETWORKS == 'true') {
            ctx.addIssue({
                code: 'custom',
                path: ['ALLOW_PRIVATE_NETWORKS'],
                message: 'must not be true in production',

            });
        }
    });

const parsed = envSchema.safeParse(process.env);

if(!parsed.success){
    console.error('Invalid environment configuration: ');
    parsed.error.issues.forEach((issue) => {
        console.error(` - ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
}

export const env = Object.freeze(parsed.data);