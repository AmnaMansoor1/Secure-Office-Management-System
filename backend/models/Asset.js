// models/Asset.js
const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add an asset name'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['Electronics', 'Furniture', 'Vehicle', 'Office Equipment', 'Software', 'Other'],
    trim: true
  },
  serialNumber: {
    type: String,
    trim: true
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Please add a purchase date']
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Please add a purchase price']
  },
  condition: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor'],
    default: 'Good'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  location: {
    type: String,
    trim: true
  },
  notes: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Asset', assetSchema);