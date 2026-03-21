import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000', // Адрес бэкенда при локальной разработке
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('access_token');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    } else if (error.response?.status === 400 || error.response?.status === 403) {
      const detail = error.response.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Произошла ошибка (400/403)');
    } else if (error.response?.status === 500) {
      toast.error('Внутренняя ошибка сервера (500). Попробуйте позже.');
    }
    return Promise.reject(error);
  }
);
