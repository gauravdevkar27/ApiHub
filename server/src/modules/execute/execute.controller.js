import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as executeService from './execute.service.js';

export const executeRequest = asyncHandler(async (req, res) => {
  const { method, url, headers, body } = req.body;

  const result = await executeService.executeRequest({ method, url, headers, body });

  res
    .status(200)
    .json(new ApiResponse(200, { result }, 'Request executed successfully.'));
});
