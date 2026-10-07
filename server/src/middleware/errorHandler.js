import ApiError from '../utils/ApiError.js';
import { env } from '../config/env.js';
/**
 * Central error handling middleware.
 * Catches all errors thrown/forwarded by controllers and middleware,
 * and sends a consistent JSON error response.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    statusCode = 409;
    const field = err.meta?.target?.[0] || 'field';
    message = `A record with this ${field} already exists.`;
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found.';
  }

  // Log server errors for debugging
  if (statusCode >= 500) {
    req.log.error({err}, 'Server error');

    if(env.NODE_ENV === 'production' && !(err instanceof ApiError)){
      message: 'Internal server Error';
    }
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
    requestId: req.id,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
