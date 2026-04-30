import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  // ✅ FIX: No default Content-Type here — it breaks multipart/form-data uploads
  // because it overrides the boundary that multer needs to parse files
});

// Attach JWT + set Content-Type only for non-FormData requests
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // ✅ FIX: Only set application/json if the body is NOT FormData
  // For FormData, axios will automatically set multipart/form-data with the correct boundary
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

// Global error / 401 handling
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      Cookies.remove('user');
      if (typeof window !== 'undefined') window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default api;