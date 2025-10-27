import axios from 'axios';

// Base API URL - update this with your actual API endpoint
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-api-url.com/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor - add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// API FUNCTIONS
// ============================================

// Auth APIs
export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  resetPassword: async (email) => {
    try {
      const response = await api.post('/auth/reset-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  verifyCode: async (email, code) => {
    try {
      const response = await api.post('/auth/verify-code', { email, code });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  setNewPassword: async (email, password) => {
    try {
      const response = await api.post('/auth/new-password', { email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Lead/Interest APIs
export const leadAPI = {
  submitInterest: async (leadData) => {
    try {
      const response = await api.post('/leads/interest', leadData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  subscribeNewsletter: async (email) => {
    try {
      const response = await api.post('/newsletter/subscribe', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Demo/Contact APIs
export const contactAPI = {
  scheduleDemo: async (contactData) => {
    try {
      const response = await api.post('/contact/demo', contactData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  sendMessage: async (messageData) => {
    try {
      const response = await api.post('/contact/message', messageData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Export the axios instance for custom requests
export default api;