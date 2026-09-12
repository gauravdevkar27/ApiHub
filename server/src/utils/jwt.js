import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7', 10);

if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set.');
}


export const signAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
};


export const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

export const generateRefreshToken = () => {
  const raw = crypto.randomBytes(64).toString('hex');   // 128-char hex string
  const hash = hashToken(raw);
  return { raw, hash };
};

/**
 * SHA-256 hash a token string. Used to hash refresh tokens before DB storage/lookup.
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Calculate refresh token expiry date.
 */
export const getRefreshTokenExpiry = () => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);
  return expiry;
};
export const signToken = signAccessToken;
export const verifyToken = verifyAccessToken;
