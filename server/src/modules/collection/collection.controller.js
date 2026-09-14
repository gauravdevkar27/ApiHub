import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as collectionService from './collection.service.js';

export const createCollection = asyncHandler(async (req, res) => {
  const { name, parentId, position } = req.body;
  const ownerId = req.user.id;

  const collection = await collectionService.createCollection(ownerId, {
    name,
    parentId,
    position,
  });

  res
    .status(201)
    .json(new ApiResponse(201, { collection }, 'Collection created successfully.'));
});


export const listCollections = asyncHandler(async (req, res) => {
  const ownerId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  const result = await collectionService.listCollections(ownerId, { page, limit });

  res
    .status(200)
    .json(new ApiResponse(200, result, 'Collections fetched successfully.'));
});


export const getCollection = asyncHandler(async (req, res) => {
  const ownerId = req.user.id;
  const { id } = req.params;

  const collection = await collectionService.getCollectionById(ownerId, id);

  res
    .status(200)
    .json(new ApiResponse(200, { collection }, 'Collection fetched successfully.'));
});


export const updateCollection = asyncHandler(async (req, res) => {
  const ownerId = req.user.id;
  const { id } = req.params;

  const collection = await collectionService.updateCollection(ownerId, id, req.body);

  res
    .status(200)
    .json(new ApiResponse(200, { collection }, 'Collection updated successfully.'));
});


export const deleteCollection = asyncHandler(async (req, res) => {
  const ownerId = req.user.id;
  const { id } = req.params;

  await collectionService.deleteCollection(ownerId, id);

  res
    .status(200)
    .json(new ApiResponse(200, null, 'Collection deleted successfully.'));
});
