// controllers/assetController.js
const Asset = require('../models/Asset');

// @desc    Get all assets
// @route   GET /api/assets
// @access  Public
exports.getAssets = async (req, res) => {
  try {
    const assets = await Asset.find().populate('assignedTo', 'name');
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get asset by ID
// @route   GET /api/assets/:id
// @access  Public
exports.getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id).populate('assignedTo', 'name');
    
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new asset
// @route   POST /api/assets
// @access  Public
exports.createAsset = async (req, res) => {
  try {
    const newAsset = new Asset(req.body);
    const savedAsset = await newAsset.save();
    res.status(201).json(savedAsset);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update an asset
// @route   PUT /api/assets/:id
// @access  Public
exports.updateAsset = async (req, res) => {
  try {
    const updatedAsset = await Asset.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedAsset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    res.json(updatedAsset);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete an asset
// @route   DELETE /api/assets/:id
// @access  Public
exports.deleteAsset = async (req, res) => {
  try {
    const deletedAsset = await Asset.findByIdAndDelete(req.params.id);
    
    if (!deletedAsset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    res.json({ message: 'Asset removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};