import axios from 'axios';

// When running in production (e.g. Render/Vercel), always use relative '/api' to avoid Mixed Content & localhost issues
const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.startsWith('10.')
);

const rawApiUrl = isLocalhost
  ? (import.meta.env.VITE_API_URL || '/api')
  : '/api';

const api = axios.create({
  baseURL: rawApiUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Access Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('elms_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Refresh & Fallback Error Messages
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('elms_refresh_token');
        if (refreshToken) {
          const res = await axios.post(`${rawApiUrl}/auth/refresh-token`, { token: refreshToken });
          const { accessToken } = res.data.data;
          localStorage.setItem('elms_access_token', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (err) {
        localStorage.removeItem('elms_access_token');
        localStorage.removeItem('elms_refresh_token');
        localStorage.removeItem('elms_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
