import axios from 'axios';

// Shared HTTP client for the Laravel API (Sanctum cookie auth).
// In dev VITE_API_URL is empty, so requests go to relative paths like
// /api/login and Vite proxies /api and /sanctum to http://localhost:8000.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Call before any POST to an auth endpoint (login, register, logout, etc.)
// so Laravel sets the XSRF-TOKEN cookie.
export function getCsrfCookie() {
  return api.get('/sanctum/csrf-cookie');
}

export default api;
