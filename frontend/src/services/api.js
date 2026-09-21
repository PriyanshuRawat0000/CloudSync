import axios from 'axios';

const CORE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const AI_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:8000/api';

const coreApi = axios.create({ baseURL: CORE_URL });
const aiHttpApi = axios.create({ baseURL: AI_URL });

export function setAuthToken(token) {
  if (token) {
    coreApi.defaults.headers.common.Authorization = `Bearer ${token}`;
    aiHttpApi.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete coreApi.defaults.headers.common.Authorization;
    delete aiHttpApi.defaults.headers.common.Authorization;
  }
}

export const authApi = {
  login: (payload) => coreApi.post('/auth/login', payload),
  register: (payload) => coreApi.post('/auth/register', payload),
  me: () => coreApi.get('/auth/me'),
};

export const providerApi = {
  getAll: () => coreApi.get('/providers'),
  getOne: (provider) => coreApi.get(`/providers/${provider}`),
};

export const adminApi = {
  updateProvider: (provider, action, payload = {}) => {
    const method = ['failure', 'reset'].includes(action) ? 'post' : 'patch';
    return coreApi[method](`/admin/providers/${provider}/${action}`, payload);
  },
};

export const workloadApi = {
  create: (payload) => coreApi.post('/workloads', payload),
  list: () => coreApi.get('/workloads'),
};

export const decisionApi = {
  evaluate: (payload) => coreApi.post('/decisions/evaluate', payload),
  history: () => coreApi.get('/decisions/history'),
};

export const routingApi = {
  current: () => coreApi.get('/routing/current'),
  manual: (payload) => coreApi.post('/routing/manual', payload),
  automatic: (payload) => coreApi.post('/routing/automatic', payload),
};

export const aiApi = {
  chat: (payload) => aiHttpApi.post('/chat', payload),
  health: () => aiHttpApi.get('/health'),
};
