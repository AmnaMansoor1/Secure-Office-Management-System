// src/services/authService.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth/';

// Simple axios instance
const api = axios.create({
  baseURL: API_URL
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    // Ensure auth endpoints are never cached
    config.headers['Cache-Control'] = 'no-cache';
    config.headers['Pragma'] = 'no-cache';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Register user
const register = async (userData) => {
  const response = await api.post('register', userData);
  
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  
  return response.data;
};

// Login user
const login = async (userData) => {
  const response = await api.post('login', userData);
  
  if (response.data && !response.data.mfaRequired) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  
  return response.data;
};

// Logout user
const logout = async () => {
  try {
    await api.post('logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('user');
  }
};

// Get user profile (bypass cache)
const getProfile = async () => {
  const response = await api.get('me', { params: { t: Date.now() } });
  return response.data;
};

// Update user profile
const updateProfile = async (userData) => {
  const response = await api.put('me', userData);
  return response.data;
};

// MFA Setup
const setupMFA = async () => {
  const response = await api.post('mfa/setup');
  return response.data;
};

// Verify MFA Setup
const verifyMFASetup = async (token) => {
  const response = await api.post('mfa/verify', { token });
  return response.data;
};

// Disable MFA
const disableMFA = async () => {
  const response = await api.post('mfa/disable');
  return response.data;
};

// Generate Backup Codes
const generateBackupCodes = async (data) => {
  const response = await api.post('mfa/backup-codes', data);
  return response.data;
};

// Forgot Password
const forgotPassword = async (email) => {
  const response = await api.post('forgot-password', { email });
  return response.data;
};

// Reset Password
const resetPassword = async ({ token, password }) => {
  const response = await api.post('reset-password', { token, password });
  return response.data;
};

// Get all users (admin only)
const getUsers = async () => {
  const response = await api.get('users');
  return response.data;
};

const authService = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  setupMFA,
  verifyMFASetup,
  disableMFA,
  generateBackupCodes,
  forgotPassword,
  resetPassword,
  getUsers
};

export default authService;