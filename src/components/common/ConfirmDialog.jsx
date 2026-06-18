import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import './ConfirmDialog.css';

/**
 * ConfirmDialog — replaces window.confirm() everywhere.
 *
 * Two modes, controlled by `variant`:
 *   - 'primary'   — neutral confirmation (e.g. "Mark as completed?")
 *                   Confirm button uses the brand colour.
 *   - 'danger'    — destructive action (delete, cancel, reject).
 *                   Confirm button is red; small warning icon shown.
 *
 * If `reasonRequired` is true a textarea appears and the confirm button stays
 * disabled until the textarea has a non-empty value. The reason string is
 * passed as the only argument to onConfirm. This single component therefore
 * handles every "are you sure?" + "give me a reason" prompt across the app.
 *
 * Behaviour:
 *   - Esc closes  (calls onCancel)
 *   - Click backdrop closes
 *   - Cancel button auto-focused (safer default)
 *   - Body scroll is locked while open
 *   - Loading state shown on confirm button while parent is awaiting an API
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
  reasonRequired = false,
  reasonPlaceholder = 'Please give a brief reason…',
  reasonLabel = 'Reason',
  reasonMaxLength = 500,
  busy = false,
}) {
  const [reason, setReason] = useState('');
  const cancelBtnRef = useRef(null);

  // Reset reason whenever the dialog reopens so stale text never lingers.
  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  // Esc to dismiss + lock body scroll while open
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onCancel?.(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setTimeout(() => cancelBtnRef.current?.focus(), 0);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onCancel]);

  if (!open) return null;

  const disabled = busy || (reasonRequired && reason.trim().length === 0);

  const handleConfirm = () => {
    if (disabled) return;
    onConfirm?.(reasonRequired ? reason.trim() : undefined);
  };

  return (
    <div
      className="cd-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cd-title"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
    >
      <div className={`cd-panel cd-variant-${variant}`}>
        <button className="cd-close" onClick={onCancel} aria-label="Close" type="button">
          <X size={18} />
        </button>

        <div className="cd-head">
          <div className={`cd-icon cd-icon-${variant}`}>
            {variant === 'danger' ? <AlertTriangle size={22} /> : <Info size={22} />}
          </div>
          <div>
            <h3 id="cd-title" className="cd-title">{title}</h3>
            {message && <p className="cd-message">{message}</p>}
          </div>
        </div>

        {reasonRequired && (
          <div className="cd-reason">
            <label className="cd-reason-label">
              {reasonLabel}
              <span className="cd-reason-required"> *</span>
            </label>
            <textarea
              className="cd-reason-input"
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, reasonMaxLength))}
              placeholder={reasonPlaceholder}
              rows={3}
              autoFocus
            />
            <div className="cd-reason-count">
              {reason.length} / {reasonMaxLength}
            </div>
          </div>
        )}

        <div className="cd-actions">
          <button
            ref={cancelBtnRef}
            type="button"
            className="cd-btn cd-btn-secondary"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`cd-btn cd-btn-primary cd-btn-${variant}`}
            onClick={handleConfirm}
            disabled={disabled}
          >
            {busy ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
