// src/services/performanceService.js
import api from './api';

const API_URL = '/performance/';

export const listEvaluations = async () => {
  const res = await api.get(API_URL);
  return res.data;
};

export const getEvaluation = async (id) => {
  const res = await api.get(`${API_URL}${id}`);
  return res.data;
};

export const evaluatePeriod = async ({ periodStart, periodEnd }) => {
  const res = await api.post(`${API_URL}evaluate`, { periodStart, periodEnd });
  return res.data;
};

export const createRating = async ({ evaluationId, employeeId, ratingType, ratingValue, notes }) => {
  const res = await api.post(`${API_URL}rate`, { evaluationId, employeeId, ratingType, ratingValue, notes });
  return res.data;
};

export const listRatings = async (params = {}) => {
  const res = await api.get(`${API_URL}ratings`, { params });
  return res.data;
};

const performanceService = { listEvaluations, getEvaluation, evaluatePeriod, createRating, listRatings };
export default performanceService;