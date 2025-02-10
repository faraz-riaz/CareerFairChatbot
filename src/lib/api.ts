import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
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

export const auth = {
  login: async (credentials: LoginCredentials) => {
    const { data } = await api.post('/users/login', credentials);
    localStorage.setItem('token', data.token);
    return data.user;
  },

  signup: async (userData: SignupData) => {
    const { data } = await api.post('/users/signup', userData);
    localStorage.setItem('token', data.token);
    return data.user;
  },

  updateUser: async (userId: string, updates: Partial<User>) => {
    const { data } = await api.patch(`/users/${userId}`, updates);
    return data;
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
    const { data } = await api.get('/chats');
    return data;
  },

  create: async (chat: Omit<Chat, 'id'>) => {
    const { data } = await api.post('/chats', chat);
    return data;
  },

  update: async (chatId: string, updates: Partial<Chat>) => {
    const { data } = await api.patch(`/chats/${chatId}`, updates);
    return data;
  },

  delete: async (chatId: string) => {
    await api.delete(`/chats/${chatId}`);
  },
}; 