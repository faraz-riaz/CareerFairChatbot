import axios from 'axios';
import type { LoginCredentials, SignupData, User } from './types/auth';
import type { Chat } from './types';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if unauthorized
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post('/users/login', credentials);
    localStorage.setItem('token', response.data.token);
    return response.data.user;
  },

  signup: async (userData: SignupData) => {
    const response = await api.post('/users/signup', userData);
    localStorage.setItem('token', response.data.token);
    return response.data.user;
  },

  updateUser: async (userId: string, updates: Partial<User>): Promise<User> => {
    try {
      // Log data being sent
      console.log('Sending profile update:', updates);
      
      const response = await api.patch(`/users/profile`, updates);
      
      // Log successful response
      console.log('Profile update success:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('API error in updateUser:', error);
      
      // More detailed error logging
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        
        if (error.response?.status === 401) {
          throw new Error('Please log in again');
        } else if (error.response?.status === 500) {
          throw new Error('Server error: ' + (error.response?.data?.message || 'Unknown error'));
        }
        
        throw new Error(error.response?.data?.error || 'Failed to update profile');
      }
      
      throw error;
    }
  },

  changePassword: async (userId: string, oldPassword: string, newPassword: string) => {
    await api.post(`/users/${userId}/change-password`, {
      oldPassword,
      newPassword,
    });
  },

  deleteUser: async (userId: string) => {
    await api.delete(`/users/${userId}`);
  },
};

export const chats = {
  getAll: async () => {
    const response = await api.get('/chats');
    return response.data;
  },

  create: async (chat: Omit<Chat, '_id'>) => {
    const response = await api.post('/chats', chat);
    return response.data;
  },

  update: async (chatId: string, updates: Partial<Chat>) => {
    const response = await api.patch(`/chats/${chatId}`, updates);
    return response.data;
  },

  delete: async (chatId: string) => {
    await api.delete(`/chats/${chatId}`);
  },
};

export const companies = {
  query: async (queryString: string) => {
    console.log('Sending query to server:', { query: queryString });
    const response = await api.post('/companies/query', { query: queryString });
    return response.data;
  },
};

export const recommendations = {
  getJobRecommendations: async (limit = 5) => {
    const response = await api.get(`/recommendations/jobs?limit=${limit}`);
    return response.data;
  },
}; 