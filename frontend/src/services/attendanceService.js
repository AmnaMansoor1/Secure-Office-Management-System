// src/services/attendanceService.js
import api from '../api';

export const fetchAttendance = async (params = {}) => {
  const res = await api.get('/attendance', { params });
  return res.data;
};

export const markAttendance = async (payload) => {
  const res = await api.post('/attendance', payload);
  return res.data;
};

export const updateAttendance = async (id, payload) => {
  const res = await api.put(`/attendance/${id}`, payload);
  return res.data;
};

export const deleteAttendance = async (id) => {
  const res = await api.delete(`/attendance/${id}`);
  return res.data;
};