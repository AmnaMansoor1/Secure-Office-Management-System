// models/Expense.js
const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add an expense title'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add an amount'],
    min: [0, 'Amount cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['Rent', 'Utilities', 'Salaries', 'Office Supplies', 'Equipment', 'Marketing', 'Travel', 'Maintenance', 'Insurance', 'Taxes', 'Miscellaneous'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Please add a date'],
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Credit Card', 'Bank Transfer', 'Check', 'Online Payment'],
    default: 'Cash'
  },
  receipt: {
    type: String,  // URL or file path to receipt image
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    set: (v) => (v === '' ? undefined : v)
  },
  recurring: {
    type: Boolean,
    default: false
  },
  recurringPeriod: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly', 'None'],
    default: 'None'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
