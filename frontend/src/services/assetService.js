


import api from './api';

// Get all assets
const getAssets = async () => {
  const response = await api.get('/assets');
  return response.data;
};

// Get single asset
const getAsset = async (id) => {
  const response = await api.get(`/assets/${id}`);
  return response.data;
};

// Create asset
const createAsset = async (assetData) => {
  const response = await api.post('/assets', assetData);
  return response.data;
};

// Update asset
const updateAsset = async (id, assetData) => {
  const response = await api.put(`/assets/${id}`, assetData);
  return response.data;
};

// Delete asset
const deleteAsset = async (id) => {
  const response = await api.delete(`/assets/${id}`);
  return response.data;
};

const assetService = {
  getAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset
};

export default assetService;