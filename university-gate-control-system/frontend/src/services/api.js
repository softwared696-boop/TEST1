import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      // Handle 403 Forbidden
      if (error.response.status === 403) {
        console.error('Access denied:', error.response.data);
      }
    }
    return Promise.reject(error);
  }
);

// API Service methods
const apiService = {
  // Auth endpoints
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (resetToken, newPassword) => 
      api.post('/auth/reset-password', { resetToken, newPassword }),
    changePassword: (currentPassword, newPassword) =>
      api.put('/auth/change-password', { currentPassword, newPassword }),
    getProfile: () => api.get('/auth/me')
  },

  // Gate Control endpoints
  gate: {
    recordLog: (logData) => api.post('/gate/log', logData),
    getLogs: (params) => api.get('/gate/logs', { params }),
    getLogById: (id) => api.get(`/gate/logs/${id}`),
    updateInspection: (id, status, notes) =>
      api.put(`/gate/logs/${id}/inspection`, { status, notes }),
    getTodayStats: (gateNumber) => api.get('/gate/stats/today', { params: { gateNumber } }),
    getRecentActivity: (limit) => api.get('/gate/activity/recent', { params: { limit } })
  }
};

export default api;
export { apiService };
