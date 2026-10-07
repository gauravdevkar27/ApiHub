import ApiError from '../utils/ApiError.js';
import { verifyToken } from '../utils/jwt.js';
import { db } from '../config/db.js';

const User = db.orm.public.User;


const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Access denied. No token provided.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Fetch fresh user from DB to ensure they still exist
    const user = await User
      .select('id', 'name', 'email', 'createdAt', 'updatedAt')
      .where({ id: decoded.id })
      .first();

    if (!user) {
      throw new ApiError(401, 'User belonging to this token no longer exists.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    // JWT verification errors (expired, malformed, etc.)
    return next(new ApiError(401, 'Invalid or expired token.'));
  }
};

export default authenticate;
