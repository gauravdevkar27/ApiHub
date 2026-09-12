import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as authService from './auth.service.js';

// ─── Cookie config ──────────────────────────────────────────────
const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,       // ★ JS cannot read this cookie (XSS-safe)
  secure: process.env.NODE_ENV === 'production',   // HTTPS only in prod
  sameSite: 'strict',   // CSRF protection
  path: '/api/v1/auth', // Only sent to auth endpoints (not every request!)
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

/**
 * Helper: extract meta (IP, user-agent) for audit trail.
 */
const extractMeta = (req) => ({
  userAgent: req.headers['user-agent'] || null,
  ipAddress: req.ip || req.connection?.remoteAddress || null,
});

// ─────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/signup
 */
export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const meta = extractMeta(req);

  const { user, accessToken, refreshToken } = await authService.signup(
    { name, email, password },
    meta
  );

  res
    .cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS)
    .status(201)
    .json(new ApiResponse(201, { user, accessToken }, 'User registered successfully.'));
});

/**
 * POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const meta = extractMeta(req);

  const { user, accessToken, refreshToken } = await authService.login(
    { email, password },
    meta
  );

  res
    .cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS)
    .status(200)
    .json(new ApiResponse(200, { user, accessToken }, 'Login successful.'));
});

/**
 * POST /api/v1/auth/refresh
 * Uses the httpOnly cookie — no token in request body.
 */
export const refresh = asyncHandler(async (req, res) => {
  const oldToken = req.cookies?.[REFRESH_COOKIE_NAME];
  const meta = extractMeta(req);

  const { user, accessToken, refreshToken } = await authService.refreshTokens(
    oldToken,
    meta
  );

  res
    .cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS)
    .status(200)
    .json(new ApiResponse(200, { user, accessToken }, 'Tokens refreshed successfully.'));
});

/**
 * POST /api/v1/auth/logout
 */
export const logoutHandler = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  await authService.logout(token);

  res
    .clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS)
    .status(200)
    .json(new ApiResponse(200, null, 'Logged out successfully.'));
});

/**
 * POST /api/v1/auth/logout-all (requires auth)
 */
export const logoutAllHandler = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.id);

  res
    .clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS)
    .status(200)
    .json(new ApiResponse(200, null, 'Logged out from all devices.'));
});

/**
 * GET /api/v1/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  res.status(200).json(new ApiResponse(200, { user }, 'Profile fetched successfully.'));
});
