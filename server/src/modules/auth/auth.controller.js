import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import * as authService from './auth.service.js';
//import { emit } from 'node:cluster';

/**
 * POST /api/v1/auth/signup
 * Register a new user.
 */
export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email, and password are required.');
  }

  if (password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, 'Please provide a valid email address.');
  }

  const result = await authService.signup({ name, email, password });

  res.status(201).json(
    new ApiResponse(201, result, 'User registered successfully.')
  );
});

/**
 * POST /api/v1/auth/login
 * Authenticate a user and return a JWT.
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
   
  // Validation
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required.');
  }

  const result = await authService.login({ email, password });

  res.status(200).json(
    new ApiResponse(200, result, 'Login successful.')
  );
});

/**
 * GET /api/v1/auth/me
 * Get current authenticated user's profile.
 * Requires: authenticate middleware
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);

  res.status(200).json(
    new ApiResponse(200, { user }, 'Profile fetched successfully.')
  );
});
