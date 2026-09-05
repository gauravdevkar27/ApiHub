import bcrypt from 'bcryptjs';
import { db } from '../../config/db.js';
import ApiError from '../../utils/ApiError.js';
import { signToken } from '../../utils/jwt.js';

const User = db.orm.public.User;


export const signup = async ({ name, email, password }) => {
  // Check if user already exists
  const existingUser = await User.where({ email }).first();

  if (existingUser) {
    throw new ApiError(409, 'A user with this email already exists.');
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({ name, email, passwordHash });

  // Generate JWT
  const token = signToken(user);

  // Return user without passwordHash
  const { passwordHash: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
};

/**
 * Authenticate an existing user.
 * Validates credentials and returns a JWT.
 */
export const login = async ({ email, password }) => {
  // Find user by email
  const user = await User.where({ email }).first();
  
  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  // Generate JWT
  const token = signToken(user);

  // Return user without passwordHash
  const { passwordHash: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
};

/**
 * Get current user profile (already authenticated via middleware).
 */
export const getProfile = async (userId) => {
  const user = await User
    .select('id', 'name', 'email', 'createdAt', 'updatedAt')
    .where({ id: userId })
    .first();

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  return user;
};
