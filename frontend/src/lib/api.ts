import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

export const api = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api',
});

api.interceptors.request.use((config) => {
  let token = Cookies.get('access_token');
  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem('access_token') || undefined;
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Отключаем кеширование для всех запросов, чтобы роль юзера всегда была актуальной
  config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  config.headers['Pragma'] = 'no-cache';
  config.headers['Expires'] = '0';
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('access_token', { path: '/' });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        // Перенаправляем на логин только если мы не на публичной странице и не в процессе логина
        if (!window.location.pathname.startsWith('/login') && 
            !window.location.pathname.startsWith('/register') &&
            window.location.pathname !== '/') {
          window.location.href = '/login';
        }
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
