import axios from 'axios';

const api = axios.create({
  baseURL: 'http://172.20.10.4:5000/api',
});

api.interceptors.request.use((config) => {
  const token = global.accessToken;
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

export default api;
