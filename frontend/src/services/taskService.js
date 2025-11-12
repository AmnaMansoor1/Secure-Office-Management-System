// src/services/taskService.js
import api from './api';

const ENDPOINT = '/tasks';

const getTasks = async (queryString = '') => {
  const url = queryString ? `${ENDPOINT}?${queryString}` : ENDPOINT;
  const response = await api.get(url);
  return response.data;
};

const getTask = async (id) => {
  const response = await api.get(`${ENDPOINT}/${id}`);
  return response.data;
};

const createTask = async (taskData) => {
  const response = await api.post(ENDPOINT, taskData);
  return response.data;
};

const updateTask = async (id, taskData) => {
  const response = await api.put(`${ENDPOINT}/${id}`, taskData);
  return response.data;
};

const deleteTask = async (id) => {
  const response = await api.delete(`${ENDPOINT}/${id}`);
  return response.data;
};

const addComment = async (taskId, comment) => {
  const response = await api.post(`${ENDPOINT}/${taskId}/comments`, { comment });
  return response.data;
};

const uploadAttachment = async (taskId, attachmentData) => {
  // Expecting FormData for file uploads
  const response = await api.post(`${ENDPOINT}/${taskId}/attachments`, attachmentData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

const deleteAttachment = async (taskId, attachmentId) => {
  const response = await api.delete(`${ENDPOINT}/${taskId}/attachments/${attachmentId}`);
  return response.data;
};

const getTaskStats = async () => {
  const response = await api.get(`${ENDPOINT}/stats`);
  return response.data;
};

const sendReminders = async () => {
  const response = await api.post(`${ENDPOINT}/reminders`);
  return response.data;
};

const taskService = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  uploadAttachment,
  deleteAttachment,
  getTaskStats,
  sendReminders
};

export default taskService;


