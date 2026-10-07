import rateLimit, { ipKeyGenerator} from 'express-rate-limit';
import ApiError from '../utils/ApiError.js';
import { env } from '../config/env.js';

const MINUTE = 60*1000;

const createLimiter = ({windowMs, limit, message, ...options}) =>
    rateLimit({
        windowMs,
        limit,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        skip: () => env.NODE_ENV === 'test',
        handler: (req,res, next) => next(new ApiError(429, message)),
        ...options,
    });

export const apiLimiter = createLimiter({
    windowMs: 15* MINUTE,
    limit: 300,
    message: 'Too many requests. Please try again later.',
});

export const loginLimiter = createLimiter({
    windowMs: 15* MINUTE,
    limit: 10,
    message: 'Too many failed login attempts. Please try again in 15 minutes.'
});

export const signupLimiter = createLimiter({
    windowMs: 60 * MINUTE,
    limit: 5,
    message: 'Too many accounts created from this IP. Please try again later.'
})

export const executeLimiter = createLimiter({
    windowMs: MINUTE,
    limit: 30,
    keyGenerator: (req) => (req.user ? String(req.user.id) : ipKeyGenerator(req.ip)),
    message: 'Too many requests sent. Please wait a minute before sending more.',
    
})