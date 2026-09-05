import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as authService from './auth.service.js';

/**
 * POST /api/v1/auth/signup
 * Register a new user.
 * Body is pre-validated by Zod middleware (see auth.validation.js).
 */
export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const result = await authService.signup({ name, email, password });

  res.status(201).json(
    new ApiResponse(201, result, 'User registered successfully.')
  );
});

/**
 * POST /api/v1/auth/login
 * Authenticate a user and return a JWT.
 * Body is pre-validated by Zod middleware (see auth.validation.js).
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login({ email, password });

  res.status(200).json(
    new ApiResponse(200, result, 'Login successful.')
  );
});


export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);

  res.status(200).json(
    new ApiResponse(200, { user }, 'Profile fetched successfully.')
  );
});
