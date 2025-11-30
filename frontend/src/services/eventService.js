// src/services/eventService.js
import api from './api';

const API_URL = '/events/';

export const listMeetings = async (params = {}) => {
  const res = await api.get(API_URL, { params });
  return res.data;
};

export const getParticipants = async () => {
  const res = await api.get(`${API_URL}participants`);
  return res.data;
};

export const getMeeting = async (id) => {
  const res = await api.get(`${API_URL}${id}`);
  return res.data;
};

export const createMeeting = async (data) => {
  const res = await api.post(API_URL, data);
  return res.data;
};

export const updateMeeting = async (id, data) => {
  const res = await api.put(`${API_URL}${id}`, data);
  return res.data;
};

export const deleteMeeting = async (id) => {
  const res = await api.delete(`${API_URL}${id}`);
  return res.data;
};

const eventService = { listMeetings, getParticipants, getMeeting, createMeeting, updateMeeting, deleteMeeting };
export default eventService;