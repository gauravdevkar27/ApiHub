import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as requestService from './request.service.js';


export const createRequest = asyncHandler(async (req, res) => {
  const ownerId = req.user.id;
  const { collectionId } = req.params;

  const request = await requestService.createRequest(ownerId, collectionId, req.body);

  res
    .status(201)
    .json(new ApiResponse(201, { request }, 'Request created successfully.'));
});


export const listRequests = asyncHandler(async (req, res) => {
  const ownerId = req.user.id;
  const { collectionId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  const result = await requestService.listRequests(ownerId, collectionId, { page, limit });

  res
    .status(200)
    .json(new ApiResponse(200, result, 'Requests fetched successfully.'));
});


export const getRequest = asyncHandler(async (req, res) => {
  const ownerId = req.user.id;
  const { id } = req.params;

  const request = await requestService.getRequestById(ownerId, id);

  res
    .status(200)
    .json(new ApiResponse(200, { request }, 'Request fetched successfully.'));
});


export const updateRequest = asyncHandler(async (req, res) => {
  const ownerId = req.user.id;
  const { id } = req.params;

  const request = await requestService.updateRequest(ownerId, id, req.body);

  res
    .status(200)
    .json(new ApiResponse(200, { request }, 'Request updated successfully.'));
});


export const deleteRequest = asyncHandler(async (req, res) => {
  const ownerId = req.user.id;
  const { id } = req.params;

  await requestService.deleteRequest(ownerId, id);

  res
    .status(200)
    .json(new ApiResponse(200, null, 'Request deleted successfully.'));
});
