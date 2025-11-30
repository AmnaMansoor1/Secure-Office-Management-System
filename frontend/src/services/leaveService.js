// src/services/leaveService.js
import api from '../api';

export const fetchLeaveRequests = async (params = {}) => {
  const res = await api.get('/leave', { params });
  return res.data;
};

export const applyLeave = async (payload) => {
  const res = await api.post('/leave', payload);
  return res.data;
};

export const decideLeave = async (id, payload) => {
  const res = await api.put(`/leave/${id}/decision`, payload);
  return res.data;
};

export const deleteLeave = async (id) => {
  const res = await api.delete(`/leave/${id}`);
  return res.data;
};