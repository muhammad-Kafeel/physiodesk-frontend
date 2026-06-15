/**
 * AuthContext.jsx — Three completely isolated portal sessions.
 *
 * ARCHITECTURE:
 *   Each portal has its own localStorage keys, React state, and API calls.
 *   Logging in as a doctor does NOT affect the patient session at all.
 *   All three portals can be simultaneously logged in on the same browser
 *   without any interference.
 *
 * STORAGE KEYS:
 *   pd_patient_token / pd_patient_user   ← patient portal only
 *   pd_doctor_token  / pd_doctor_user    ← doctor portal only
 *   pd_admin_token   / pd_admin_user     ← admin portal only
 *
 * HOOKS EXPORTED:
 *   usePatientAuth()  — always returns the patient session
 *   useDoctorAuth()   — always returns the doctor session
 *   useAdminAuth()    — always returns the admin session
 *   usePortalAuth()   — smart: auto-selects session from current URL path
 *   useAuth()         — alias of usePortalAuth() for backward compat
 *
 * MIGRATION:
 *   On first mount, any existing old-format keys (pd_token / pd_user /
 *   pd_portal) are silently migrated to the new portal-scoped keys and
 *   then removed, so logged-in users are not forced to re-login.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { patientAuthAPI, doctorAuthAPI, adminAuthAPI } from '../api/services';

// ── Storage key map ───────────────────────────────────────────────────────────
const STORAGE = {
  patient: { token: 'pd_patient_token', user: 'pd_patient_user' },
  doctor:  { token: 'pd_doctor_token',  user: 'pd_doctor_user'  },
  admin:   { token: 'pd_admin_token',   user: 'pd_admin_user'   },
};

// ── Login redirect per portal ─────────────────────────────────────────────────
const LOGIN_PATH = {
  patient: '/patient/login',
  doctor:  '/doctor/login',
  admin:   '/admin/login',
};

// ── Separate React contexts — one per portal ──────────────────────────────────
const PatientAuthContext = createContext(null);
const DoctorAuthContext  = createContext(null);
const AdminAuthContext   = createContext(null);

// ── One-time migration from old single-slot storage ───────────────────────────
// Users logged in before this update had:  pd_token / pd_user / pd_portal
// We silently lift their session into the correct new-format key so they
// don't have to re-login, then remove the old keys permanently.
function migrateOldStorage() {
  const oldToken  = localStorage.getItem('pd_token');
  const oldUser   = localStorage.getItem('pd_user');
  const oldPortal = localStorage.getItem('pd_portal');

  if (oldToken && oldPortal && STORAGE[oldPortal]) {
    const { token: newTokenKey, user: newUserKey } = STORAGE[oldPortal];
    // Only migrate if the destination doesn't already exist (avoid clobber)
    if (!localStorage.getItem(newTokenKey)) {
      localStorage.setItem(newTokenKey, oldToken);
      if (oldUser) localStorage.setItem(newUserKey, oldUser);
    }
  }

  // Remove old keys regardless — they must never come back
  localStorage.removeItem('pd_token');
  localStorage.removeItem('pd_user');
  localStorage.removeItem('pd_portal');
  localStorage.removeItem('pd_view_mode');
}

// ── Portal session factory ────────────────────────────────────────────────────
// Builds one independent session slice (state + actions) for a given portal.
// Called three times inside AuthProvider — once per portal.
function usePortalSession(portal, meApiFn, logoutApiFn) {
  const keys = STORAGE[portal];

  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(keys.user) || 'null'); }
    catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem(keys.token) || null);
  const [loading, setLoading] = useState(true);

  // On mount: verify the stored token against the portal's own /me endpoint.
  // A doctor token sent to patientAuthAPI.me() will fail (403) and clear only
  // the patient session — the doctor session is untouched.
  useEffect(() => {
    let cancelled = false;
    const verify = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const res = await meApiFn();
        if (cancelled) return;
        const fresh = res.data.data;
        setUser(fresh);
        localStorage.setItem(keys.user, JSON.stringify(fresh));
      } catch {
        // Token invalid or expired — clear only this portal's session
        if (!cancelled) _clear();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    verify();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Internal clear ──────────────────────────────────────────────────────────
  // Removes only this portal's data from state + storage.
  // The other two portals' keys are never touched.
  const _clear = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(keys.token);
    localStorage.removeItem(keys.user);
  }, [keys]);

  // ── login(userData, authToken) ──────────────────────────────────────────────
  // Called by login / register pages after a successful API response.
  // The old code passed a third argument (portalName) that is now intentionally
  // ignored — the portal is implicit in which context's login() is called.
  const login = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem(keys.token, authToken);
    localStorage.setItem(keys.user, JSON.stringify(userData));
  }, [keys]);

  // ── logout() ────────────────────────────────────────────────────────────────
  // Calls the portal's own logout API, clears only this portal's storage,
  // then redirects to this portal's login page.
  const logout = useCallback(async (redirectOverride = null) => {
    try { await logoutApiFn(); } catch { /* best-effort — ignore network errors */ }
    _clear();
    window.location.href = redirectOverride ?? LOGIN_PATH[portal];
  }, [portal, logoutApiFn, _clear]);

  return { user, token, loading, login, logout };
}

// ── AuthProvider ──────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  // Migrate old shared-session keys on first render (runs once)
  useEffect(() => { migrateOldStorage(); }, []);

  // Three completely independent sessions running in parallel
  const patient = usePortalSession('patient', patientAuthAPI.me, patientAuthAPI.logout);
  const doctor  = usePortalSession('doctor',  doctorAuthAPI.me,  doctorAuthAPI.logout);
  const admin   = usePortalSession('admin',   adminAuthAPI.me,   adminAuthAPI.logout);

  return (
    <PatientAuthContext.Provider value={patient}>
      <DoctorAuthContext.Provider value={doctor}>
        <AdminAuthContext.Provider value={admin}>
          {children}
        </AdminAuthContext.Provider>
      </DoctorAuthContext.Provider>
    </PatientAuthContext.Provider>
  );
}

// ── Portal-specific hooks ─────────────────────────────────────────────────────

/**
 * usePatientAuth() — ALWAYS returns the patient session, regardless of URL.
 * Use in: PatientLoginPage, PatientRegisterPage, PatientRoute guard.
 */
export const usePatientAuth = () => {
  const ctx = useContext(PatientAuthContext);
  if (!ctx) throw new Error('usePatientAuth must be used inside <AuthProvider>');
  return ctx;
};

/**
 * useDoctorAuth() — ALWAYS returns the doctor session, regardless of URL.
 * Use in: DoctorLoginPage, DoctorRegisterPage, DoctorRoute guard.
 */
export const useDoctorAuth = () => {
  const ctx = useContext(DoctorAuthContext);
  if (!ctx) throw new Error('useDoctorAuth must be used inside <AuthProvider>');
  return ctx;
};

/**
 * useAdminAuth() — ALWAYS returns the admin session, regardless of URL.
 * Use in: AdminLoginPage, AdminRoute guard.
 */
export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside <AuthProvider>');
  return ctx;
};

// ── Smart hook: session auto-selected from current URL ────────────────────────
/**
 * usePortalAuth()
 *
 * Returns the session for whichever portal the user is currently browsing:
 *   /admin/*    →  admin session
 *   /doctor/*   →  doctor session
 *   anything else → patient session
 *
 * Also exposes:
 *   portal    — 'patient' | 'doctor' | 'admin'
 *   isAdmin   — () => boolean
 *   isDoctor  — () => boolean
 *   isPatient — () => boolean
 *
 * Used by layout components (Sidebar, Navbar) that must reflect the active
 * portal's user info and logout function automatically.
 *
 * CRITICAL ISOLATION: a doctor logged in on /doctor/* has ZERO effect on
 * the patient session returned on /patient/* routes, and vice versa.
 */
export const usePortalAuth = () => {
  const location = useLocation();
  const patient  = usePatientAuth();
  const doctor   = useDoctorAuth();
  const admin    = useAdminAuth();

  const portal =
    location.pathname.startsWith('/admin')  ? 'admin'  :
    location.pathname.startsWith('/doctor') ? 'doctor' :
    'patient';

  const session =
    portal === 'admin'  ? admin  :
    portal === 'doctor' ? doctor :
    patient;

  return {
    ...session,
    portal,
    isAdmin:   () => portal === 'admin',
    isDoctor:  () => portal === 'doctor',
    isPatient: () => portal === 'patient',
  };
};

// ── useAuth() — backward-compat alias ────────────────────────────────────────
// All components that previously used useAuth() continue working unchanged.
// They now transparently get the portal-scoped session from usePortalAuth().
export const useAuth = usePortalAuth;
