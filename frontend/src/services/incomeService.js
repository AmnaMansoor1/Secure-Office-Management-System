import api from '../api';

// Get all incomes
const getIncomes = async () => {
  const response = await api.get('/income');
  return response.data;
};

// Get income by ID
const getIncome = async (id) => {
  const response = await api.get(`/income/${id}`);
  return response.data;
};

// Create income
const createIncome = async (incomeData) => {
  const response = await api.post('/income', incomeData);
  return response.data;
};

// Update income
const updateIncome = async (id, incomeData) => {
  const response = await api.put(`/income/${id}`, incomeData);
  return response.data;
};

// Delete income
const deleteIncome = async (id) => {
  const response = await api.delete(`/income/${id}`);
  return response.data;
};

const incomeService = {
  getIncomes,
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome
};

export default incomeService;