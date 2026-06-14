import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// ── Request interceptor ───────────────────────────────────────────────────────
// Attach the stored token and tell the backend which portal this request is from.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pd_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // X-Portal header is for logging / debugging on the backend only.
  // It never grants extra privileges — role enforcement is purely server-side.
  const portal = localStorage.getItem('pd_portal');
  if (portal) config.headers['X-Portal'] = portal;

  return config;
});

// ── Response interceptor ──────────────────────────────────────────────────────
// On 401 (expired / invalid token), clear session data and redirect to the
// login page that matches the portal the user was working on.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const portal = localStorage.getItem('pd_portal') || 'patient';

      // Wipe all session keys
      localStorage.removeItem('pd_token');
      localStorage.removeItem('pd_user');
      localStorage.removeItem('pd_portal');
      localStorage.removeItem('pd_view_mode');

      // Redirect to the correct portal login — never the wrong one
      const loginPaths = {
        patient : '/patient/login',
        doctor  : '/doctor/login',
        admin   : '/admin/login',
      };
      window.location.href = loginPaths[portal] ?? '/patient/login';
    }

    return Promise.reject(error);
  }
);

export default api;
