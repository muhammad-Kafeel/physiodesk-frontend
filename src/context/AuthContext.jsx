import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { patientAuthAPI, doctorAuthAPI, adminAuthAPI } from '../api/services';

/**
 * AuthContext
 *
 * Storage keys (all namespaced with pd_ prefix):
 *   pd_token   — the bearer token issued at login
 *   pd_user    — serialised user object
 *   pd_portal  — 'patient' | 'doctor' | 'admin'
 *
 * Isolation rules enforced here:
 *   • login() always writes portal alongside token — they travel together.
 *   • logout() clears ALL three keys so no ghost session can linger.
 *   • The /me endpoint called on mount is portal-aware — it hits the correct
 *     role-scoped backend route, so a stale doctor token won't re-hydrate as
 *     a patient session.
 *   • viewMode (doctor-browses-as-patient) is kept but now only lives in
 *     memory — it is never stored in localStorage to avoid confusion with
 *     the portal key.
 */

const AuthContext = createContext(null);

// Map portal → me() function
const meByPortal = {
  patient : () => patientAuthAPI.me(),
  doctor  : () => doctorAuthAPI.me(),
  admin   : () => adminAuthAPI.me(),
};

// Map portal → login page path (used by logout)
const loginPathByPortal = {
  patient : '/patient/login',
  doctor  : '/doctor/login',
  admin   : '/admin/login',
};

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('pd_user') || 'null'); }
    catch { return null; }
  });
  const [token,   setToken]   = useState(() => localStorage.getItem('pd_token') || null);
  const [portal,  setPortal]  = useState(() => localStorage.getItem('pd_portal') || null);
  const [loading, setLoading] = useState(true);

  // On mount, verify the stored token is still valid using the correct portal endpoint
  useEffect(() => {
    const verify = async () => {
      if (!token || !portal) { setLoading(false); return; }

      const meFn = meByPortal[portal];
      if (!meFn) { logout(); return; }   // unknown portal value — clear everything

      try {
        const res = await meFn();
        const freshUser = res.data.data;
        setUser(freshUser);
        localStorage.setItem('pd_user', JSON.stringify(freshUser));
      } catch {
        // Token invalid / expired — clear silently; axios interceptor handles redirect
        _clearSession();
      } finally {
        setLoading(false);
      }
    };
    verify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── login ─────────────────────────────────────────────────────────────────
  /**
   * Called by each login page after a successful API response.
   * @param {object} userData  - user object from the API
   * @param {string} authToken - bearer token from the API
   * @param {string} portalName - 'patient' | 'doctor' | 'admin'
   */
  const login = useCallback((userData, authToken, portalName) => {
    setUser(userData);
    setToken(authToken);
    setPortal(portalName);
    localStorage.setItem('pd_user',   JSON.stringify(userData));
    localStorage.setItem('pd_token',  authToken);
    localStorage.setItem('pd_portal', portalName);
    localStorage.removeItem('pd_view_mode');
  }, []);

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async (redirectOverride = null) => {
    const currentPortal = portal || localStorage.getItem('pd_portal');

    // Call the correct logout endpoint (best-effort — ignore errors)
    try {
      if (currentPortal === 'patient') await patientAuthAPI.logout();
      else if (currentPortal === 'doctor') await doctorAuthAPI.logout();
      else if (currentPortal === 'admin')  await adminAuthAPI.logout();
    } catch {}

    _clearSession();
    // Redirect to the portal-specific login page
    const dest = redirectOverride ?? loginPathByPortal[currentPortal] ?? '/patient/login';
    window.location.href = dest;
  }, [portal]);

  // ── internal session clear ────────────────────────────────────────────────
  const _clearSession = () => {
    setUser(null);
    setToken(null);
    setPortal(null);
    localStorage.removeItem('pd_user');
    localStorage.removeItem('pd_token');
    localStorage.removeItem('pd_portal');
    localStorage.removeItem('pd_view_mode');
  };

  // ── helpers ───────────────────────────────────────────────────────────────
  const isAdmin   = () => user?.role === 'admin';
  const isDoctor  = () => user?.role === 'doctor';
  const isPatient = () => user?.role === 'patient';

  return (
    <AuthContext.Provider value={{
      user, token, portal, loading,
      login, logout,
      isAdmin, isDoctor, isPatient,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
