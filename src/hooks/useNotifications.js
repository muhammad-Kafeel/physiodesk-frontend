import { useCallback, useEffect, useRef, useState } from 'react';
import { notificationAPI } from '../api/services';

/**
 * useNotifications — drives the bell icon, the dropdown list, and the toast.
 *
 * Single source of truth so the bell badge, the dropdown count and the toast
 * never disagree. Mount this once at the top of each portal's layout (we
 * mount it in Navbar so all dashboards share one instance).
 *
 * Polling strategy
 * ────────────────
 *  - Active tab     → poll /unread-count every 30s
 *  - Hidden tab     → pause polling (browser visibility API). Resume + do an
 *                     immediate fetch on visibilitychange so users opening a
 *                     stale tab see fresh counts within ~1 frame.
 *  - On reconnect   → also do an immediate fetch on window 'focus'.
 *
 * OS notifications
 * ────────────────
 *  We ask for Notification permission ONLY after the user clicks the bell
 *  the first time — never on page load. Asking on load looks like a popup
 *  attack; asking after intent is the Gmail / Linear pattern.
 *
 * Defensive
 * ─────────
 *  Every API call is wrapped — a network blip must never crash the layout.
 *  Failures silently leave the previous count in place.
 */
const POLL_MS = 30_000;
const SEEN_STORAGE_KEY = 'pd_notif_last_id'; // per-tab "high water mark"

export default function useNotifications({ enabled = true } = {}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Tracks the id of the newest notification we've already "announced" so we
  // don't fire a desktop toast for the same row twice across polls.
  const lastSeenIdRef = useRef(Number(localStorage.getItem(SEEN_STORAGE_KEY)) || 0);

  // ── Core fetches ──────────────────────────────────────────────────────────

  const fetchCount = useCallback(async () => {
    if (!enabled) return;
    try {
      const r = await notificationAPI.unreadCount();
      const c = r?.data?.data?.count ?? 0;
      setUnreadCount(c);
    } catch {
      /* swallow — keep previous count, never crash the layout */
    }
  }, [enabled]);

  const fetchList = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const r = await notificationAPI.list();
      // Laravel paginator → r.data.data.data
      const rows = r?.data?.data?.data ?? [];
      setItems(rows);

      // Fire a desktop notification for any row newer than our high-water
      // mark. Only one toast per poll, even if 5 new arrived at once — too
      // many toasts is its own problem. We pick the newest.
      const newest = rows.find((n) => !n.read_at);
      if (newest && newest.id > lastSeenIdRef.current) {
        maybeShowDesktopNotification(newest);
        lastSeenIdRef.current = newest.id;
        localStorage.setItem(SEEN_STORAGE_KEY, String(newest.id));
      }
    } catch {
      /* swallow */
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const markRead = useCallback(async (id) => {
    // Optimistic: drop the badge immediately, roll back on failure.
    setItems((prev) =>
      prev.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try { await notificationAPI.markRead(id); }
    catch { fetchCount(); fetchList(); }
  }, [fetchCount, fetchList]);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })));
    setUnreadCount(0);
    try { await notificationAPI.markAllRead(); }
    catch { fetchCount(); fetchList(); }
  }, [fetchCount, fetchList]);

  // ── Polling lifecycle ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!enabled) return undefined;

    fetchCount();

    let intervalId = null;

    const start = () => {
      if (intervalId) return;
      intervalId = setInterval(fetchCount, POLL_MS);
    };
    const stop = () => {
      if (!intervalId) return;
      clearInterval(intervalId);
      intervalId = null;
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        fetchCount();          // catch up immediately on tab refocus
        fetchList();           // and refresh the dropdown contents
        start();
      }
    };
    const onFocus = () => {
      if (!document.hidden) fetchCount();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);

    if (!document.hidden) start();

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, [enabled, fetchCount, fetchList]);

  return {
    unreadCount,
    items,
    loading,
    refresh: fetchList,
    markRead,
    markAllRead,
    requestOsPermission,
  };
}

// ── OS-level notifications ──────────────────────────────────────────────────

/**
 * Ask the browser for Notification permission. Idempotent — calling on a
 * granted/denied state is a no-op.
 *
 * Returns the resulting permission state so callers can update UI.
 */
export async function requestOsPermission() {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

function maybeShowDesktopNotification(notif) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  // The page itself probably already shows a badge — only show the OS toast
  // when the tab is hidden, so we never double-notify a user looking at
  // the screen.
  if (!document.hidden) return;
  try {
    const n = new Notification(notif.title || 'PhysioDesk', {
      body: notif.message || '',
      tag: `pd-notif-${notif.id}`, // dedupe across tabs
      silent: true,
    });
    n.onclick = () => {
      window.focus();
      const link = notif.data?.link;
      if (link) window.location.href = link;
      n.close();
    };
  } catch {
    /* some browsers throw if permission was revoked between checks */
  }
}
