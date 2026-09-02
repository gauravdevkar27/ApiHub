/**
 * Wraps an async route handler so that any thrown error
 * is automatically forwarded to Express's error middleware.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
