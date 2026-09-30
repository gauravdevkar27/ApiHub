import axiosClient from './axiosClient.js';

/**
 * POST /v1/auth/signup
 * @param {{ name: string, email: string, password: string }} payload
 * @returns {{ user, accessToken }}
 */
export const signupApi = async ({ name, email, password }) => {
  const { data } = await axiosClient.post('/v1/auth/signup', {
    name,
    email,
    password,
  });
  return data; 
};

/**
 * POST /v1/auth/login
 * @param {{ email: string, password: string }} payload
 * @returns {{ user, accessToken }}
 */
export const loginApi = async ({ email, password }) => {
  const { data } = await axiosClient.post('/v1/auth/login', {
    email,
    password,
  });
  return data;
};

/**
 * POST /v1/auth/refresh
 * Refresh token is sent via httpOnly cookie automatically
 * @returns {{ user, accessToken }}
 */
export const refreshApi = async () => {
  const { data } = await axiosClient.post('/v1/auth/refresh');
  return data;
};

/**
 * POST /v1/auth/logout
 * Clears the httpOnly refresh token cookie
 */
export const logoutApi = async () => {
  const { data } = await axiosClient.post('/v1/auth/logout');
  return data;
};

/**
 * GET /v1/auth/me
 * Requires access token (attached by interceptor)
 * @returns {{ user }}
 */
export const getMeApi = async () => {
  const { data } = await axiosClient.get('/v1/auth/me');
  return data;
};
