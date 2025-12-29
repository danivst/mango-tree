import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

interface RefreshTokenResponse {
  token: string;
}

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    config.headers = config.headers ?? {};
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// auto-refresh interceptor
api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const originalRequest = err.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return Promise.reject(err);

      try {
        const { data } = await axios.post<RefreshTokenResponse>(
          'http://localhost:3000/api/auth/refresh-token',
          { token: refreshToken }
        );

        localStorage.setItem('token', data.token);

        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers['Authorization'] = `Bearer ${data.token}`;

        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(err);
  }
);

export default api;