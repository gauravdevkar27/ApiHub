import bcrypt from 'bcryptjs';
import { db } from '../../config/db.js';
import ApiError from '../../utils/ApiError.js';
import {
  signAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  hashToken,
} from '../../utils/jwt.js';

const User = db.orm.public.User;
const RefreshToken = db.orm.public.RefreshToken;


const generateTokenPair = async (user, meta = {}) => {
  const accessToken = signAccessToken(user);
  const { raw: refreshToken, hash: tokenHash } = generateRefreshToken();

  
  await RefreshToken.create({
    tokenHash,
    userId: user.id,
    expiresAt: getRefreshTokenExpiry(),
    userAgent: meta.userAgent || null,
    ipAddress: meta.ipAddress || null,
  });

  return { accessToken, refreshToken };
};

const sanitizeUser = (user) => {
  const { passwordHash, ...safe } = user;
  return safe;
};


export const signup = async ({ name, email, password }, meta = {}) => {
  const existingUser = await User.where({ email }).first();
  if (existingUser) {
    throw new ApiError(409, 'A user with this email already exists.');
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);
  const user = await User.create({ name, email, passwordHash });

  const { accessToken, refreshToken } = await generateTokenPair(user, meta);
  
  return { user: sanitizeUser(user), accessToken, refreshToken };
};

export const login = async ({ email, password }, meta = {}) => {
  const user = await User.where({ email }).first();
  if (!user) throw new ApiError(401, 'Invalid email or password.');

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new ApiError(401, 'Invalid email or password.');

  const { accessToken, refreshToken } = await generateTokenPair(user, meta);

  return { user: sanitizeUser(user), accessToken, refreshToken };
};


export const refreshTokens = async (oldRawToken, meta = {}) => {
  if (!oldRawToken) {
    throw new ApiError(401, 'Refresh token is required.');
  }

  const oldHash = hashToken(oldRawToken);


  const storedToken = await RefreshToken.where({ tokenHash: oldHash }).first();

  if (!storedToken) {
    throw new ApiError(403, 'Refresh token reuse detected. Please log in again.');
  }

  // Check expiration
  if (Temporal.Instant.compare(storedToken.expiresAt, Temporal.Now.instant()) < 0) {
    
    await RefreshToken.where({ id: storedToken.id }).delete();
    throw new ApiError(401, 'Refresh token has expired. Please log in again.');
  }

  await RefreshToken.where({ id: storedToken.id }).delete();
  const user = await User
    .select('id', 'name', 'email', 'createdAt', 'updatedAt')
    .where({ id: storedToken.userId })
    .first();

  if (!user) {
    throw new ApiError(401, 'User no longer exists.');
  }

  const { accessToken, refreshToken } = await generateTokenPair(user, meta);

  return { user, accessToken, refreshToken };
};

/**
 * Logout: revoke the specific refresh token.
 */
export const logout = async (rawToken) => {
  if (!rawToken) return;

  const tokenHash = hashToken(rawToken);
  await RefreshToken.where({ tokenHash }).delete();
};


export const logoutAll = async (userId) => {
  await RefreshToken.where({ userId }).delete();
};

export const getProfile = async (userId) => {
  const user = await User
    .select('id', 'name', 'email', 'createdAt', 'updatedAt')
    .where({ id: userId })
    .first();

  if (!user) throw new ApiError(404, 'User not found.');
  return user;
};
