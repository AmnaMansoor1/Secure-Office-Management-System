import api from '../api';

// Get all expenses
const getExpenses = async () => {
  const response = await api.get('/expenses');
  return response.data;
};

// Get expense by ID
const getExpense = async (id) => {
  const response = await api.get(`/expenses/${id}`);
  return response.data;
};

// Create expense
const createExpense = async (expenseData) => {
  const response = await api.post('/expenses', expenseData);
  return response.data;
};

// Update expense
const updateExpense = async (id, expenseData) => {
  const response = await api.put(`/expenses/${id}`, expenseData);
  return response.data;
};

// Delete expense
const deleteExpense = async (id) => {
  const response = await api.delete(`/expenses/${id}`);
  return response.data;
};

const expenseService = {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense
};

export default expenseService;