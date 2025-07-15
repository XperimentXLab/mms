import axios, { type AxiosRequestConfig } from "axios"

export const baseURL = import.meta.env.VITE_BASE_URL ?? 'http://127.0.0.1:8000/server'
const tokenURL = `${baseURL}/token/refresh/`

export const generateDeviceFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return Math.random().toString(36).substring(2, 15);
  }

  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('fingerprint', 2, 2);
  return canvas.toDataURL().slice(-16);
};

import { useEffect } from 'react';

export const useAutoLogout = () => {
  useEffect(() => {
    const resetTimer = () => {
      clearTimeout((window as any).inactivityTimer);
      (window as any).inactivityTimer = setTimeout(() => {
        sessionStorage.clear();
        window.location.href = '/login';
      }, 30 * 60 * 1000); // 30 minutes
    };

    ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event =>
      window.addEventListener(event, resetTimer)
    );

    resetTimer();

    return () => {
      ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event =>
        window.removeEventListener(event, resetTimer)
      );
      clearTimeout((window as any).inactivityTimer);
    };
  }, []);
};


const api = axios.create({
  baseURL: baseURL,
  withCredentials: false,
  timeout: 20000,
})

// Request interceptor for auth headers
api.interceptors.request.use((config) => {
  const accessToken = sessionStorage.getItem('access_token')
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${accessToken}`;
    config.headers['X-Device-Fingerprint'] = generateDeviceFingerprint();
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

api.interceptors.response.use((response) => response, async (error) => {

  const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
  const refreshToken = sessionStorage.getItem('refresh_token');

  if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
    originalRequest._retry = true;
    
    try {
      const response = await axios.post<{ access: string; refresh?: string }>(
        tokenURL,
        { refresh: refreshToken }
      );

      const newTokens = {
        access: response.data.access,
        refresh: response.data.refresh || refreshToken,
      };

      // Update storage
      sessionStorage.setItem('access_token', newTokens.access);
      sessionStorage.setItem('refresh_token', newTokens.refresh);

      // Update axios defaults
      api.defaults.headers.common['Authorization'] = `Bearer ${newTokens.access}`;

      // Update the original request header
      if (originalRequest.headers) {
        originalRequest.headers['Authorization'] = `Bearer ${newTokens.access}`;
      }

      return api(originalRequest)

    } catch (refreshError) {
      // Clear tokens on refresh failure
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      delete api.defaults.headers.common['Authorization'];
      return Promise.reject(refreshError);
    }
  }
  return Promise.reject(error)
})

export default api

