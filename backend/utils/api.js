import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// Auto-refresh interceptor
api.interceptors.response.use(
  res => res,
  async err => {
    const originalRequest = err.config;
    if (err.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return Promise.reject(err);

      const { data } = await axios.post('http://localhost:3000/api/auth/refresh-token', { token: refreshToken });
      localStorage.setItem('token', data.token);
      originalRequest.headers['Authorization'] = `Bearer ${data.token}`;
      return api(originalRequest);
    }
    return Promise.reject(err);
  }
);

export default api;