import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

// Single-flight: если несколько запросов одновременно получили 401,
// обновляем токен ОДИН раз (общий промис), остальные ждут его —
// иначе ротация refresh-токена ломается гонкой и выкидывает из системы.
let refreshPromise = null;

function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return Promise.reject(new Error('no refresh token'));
  if (!refreshPromise) {
    const baseURL = import.meta.env.VITE_API_URL || '/api';
    refreshPromise = axios
      .post(baseURL + '/auth/refresh', { refreshToken })
      .then((res) => {
        localStorage.setItem('accessToken', res.data.data.accessToken);
        localStorage.setItem('refreshToken', res.data.data.refreshToken);
        return res.data.data.accessToken;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        const newToken = await refreshAccessToken();
        original.headers.Authorization = 'Bearer ' + newToken;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
