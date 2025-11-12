// src/services/notificationService.js
import api from './api';

const API_URL = '/notifications/';

const getNotifications = async () => {
  const response = await api.get(API_URL);
  return response.data;
};

const markAsRead = async (notificationId) => {
  const response = await api.put(`${API_URL}${notificationId}/read`);
  return response.data;
};

const markAllAsRead = async () => {
  const response = await api.put(`${API_URL}read-all`);
  return response.data;
};

const deleteNotification = async (notificationId) => {
  const response = await api.delete(`${API_URL}${notificationId}`);
  return response.data;
};

const notificationService = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};

export default notificationService;
