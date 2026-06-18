import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Inbox } from 'lucide-react';
import useNotifications, { requestOsPermission } from '../../hooks/useNotifications';
import './NotificationBell.css';

/**
 * NotificationBell
 *
 * The single bell icon that lives in the top navbar for all three portals.
 * Clicking it opens a dropdown of the latest notifications.
 *
 * Behaviour worth noting:
 *  - The unread badge is always live from `useNotifications`. It updates
 *    every 30s (while the tab is visible) and immediately on tab refocus.
 *  - The dropdown only fetches the FULL list on open — saves bandwidth.
 *  - First open also triggers the OS-permission request, which is the
 *    standard "ask on intent, never on load" pattern.
 *  - Clicking a notification: mark-read + navigate to its link. If the
 *    notification carries `expand_id`, we append `?expand=ID` so the
 *    destination page can auto-expand the relevant card.
 */
export default function NotificationBell({ enabled = true }) {
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const askedOsRef = useRef(false);

  const {
    unreadCount,
    items,
    loading,
    refresh,
    markRead,
    markAllRead,
  } = useNotifications({ enabled });

  // Close when clicking outside the bell+panel
  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      refresh();
      // Ask for OS permission on FIRST open (intent-based)
      if (!askedOsRef.current) {
        askedOsRef.current = true;
        await requestOsPermission();
      }
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.read_at) markRead(notif.id);
    const link = notif.data?.link;
    if (link) {
      const sep = link.includes('?') ? '&' : '?';
      const url = notif.data?.expand_id ? `${link}${sep}expand=${notif.data.expand_id}` : link;
      navigate(url);
      setOpen(false);
    }
  };

  if (!enabled) return null;

  return (
    <div className="nb-bell-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`nb-bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={handleOpen}
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="nb-bell-badge" aria-label={`${unreadCount} unread`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="nb-bell-panel" role="dialog" aria-label="Notifications">
          <div className="nb-bell-head">
            <span className="nb-bell-title">Notifications</span>
            {items.some((n) => !n.read_at) && (
              <button
                type="button"
                className="nb-bell-markall"
                onClick={markAllRead}
                title="Mark all as read"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="nb-bell-list">
            {loading && items.length === 0 ? (
              <div className="nb-bell-empty">
                <div className="nb-bell-spinner" />
                <span>Loading…</span>
              </div>
            ) : items.length === 0 ? (
              <div className="nb-bell-empty">
                <Inbox size={28} strokeWidth={1.5} />
                <span>You're all caught up</span>
                <small>New activity will show here.</small>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`nb-bell-item ${n.read_at ? '' : 'unread'}`}
                  onClick={() => handleItemClick(n)}
                >
                  <span className={`nb-bell-dot type-${n.type}`} aria-hidden />
                  <span className="nb-bell-item-body">
                    <span className="nb-bell-item-title">{n.title}</span>
                    <span className="nb-bell-item-msg">{n.message}</span>
                    <span className="nb-bell-item-time">{formatRelative(n.created_at)}</span>
                  </span>
                  {!n.read_at && (
                    <span
                      className="nb-bell-item-check"
                      title="Mark as read"
                      onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                    >
                      <Check size={13} />
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Friendly "x minutes ago" formatter. Kept tiny so we don't drag in dayjs
 * just for one widget.
 */
function formatRelative(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.round(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const d = Math.round(hr / 24);
  if (d < 7) return `${d} day${d > 1 ? 's' : ''} ago`;
  return new Date(iso).toLocaleDateString();
}
