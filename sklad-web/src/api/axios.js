import axios from 'axios';
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const baseURL = import.meta.env.VITE_API_URL || '/api';
          const res = await axios.post(baseURL + '/auth/refresh', { refreshToken });
          localStorage.setItem('accessToken', res.data.data.accessToken);
          localStorage.setItem('refreshToken', res.data.data.refreshToken);
          err.config.headers.Authorization = 'Bearer ' + res.data.data.accessToken;
          return axios(err.config);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);
export default api;
