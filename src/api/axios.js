import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

// ── Factory ───────────────────────────────────────────────────────────────────
// Each portal gets its own axios instance that reads from its OWN token key
// and, on 401, clears only ITS own session — never touching the other portals.
function makeInstance(tokenKey, userKey, loginPath) {
  const instance = axios.create({ baseURL: BASE_URL, headers: DEFAULT_HEADERS });

  // Attach the bearer token that belongs to this specific portal
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem(tokenKey);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // On 401 — clear ONLY this portal's storage, redirect to ITS login page.
  // The other two portals are completely unaffected.
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem(tokenKey);
        localStorage.removeItem(userKey);
        window.location.href = loginPath;
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

// ── Three completely isolated axios instances ─────────────────────────────────
export const patientApi = makeInstance('pd_patient_token', 'pd_patient_user', '/patient/login');
export const doctorApi  = makeInstance('pd_doctor_token',  'pd_doctor_user',  '/doctor/login');
export const adminApi   = makeInstance('pd_admin_token',   'pd_admin_user',   '/admin/login');

// ── Smart selector ────────────────────────────────────────────────────────────
// Used for endpoints accessible by multiple roles (prescriptions, medical
// records, complaints, public listings).  Picks the right instance from the
// current URL path so the correct token is always attached.
export const getApi = () => {
  const path = window.location.pathname;
  if (path.startsWith('/admin'))  return adminApi;
  if (path.startsWith('/doctor')) return doctorApi;
  return patientApi;
};

// ── Default export (backward compat) ─────────────────────────────────────────
// Files still doing `import api from './axios'` get the smart proxy.
// These should be migrated to named imports in a future cleanup pass.
const smartProxy = {
  get:    (url, config)     => getApi().get(url, config),
  post:   (url, data, c)    => getApi().post(url, data, c),
  put:    (url, data, c)    => getApi().put(url, data, c),
  delete: (url, config)     => getApi().delete(url, config),
  patch:  (url, data, c)    => getApi().patch(url, data, c),
};

export default smartProxy;
