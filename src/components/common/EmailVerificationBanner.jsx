/**
 * EmailVerificationBanner
 *
 * Shows a dismissible amber warning strip whenever the signed-in user has not
 * yet verified their email. Works for patient, doctor, and admin portals — just
 * pass the matching resendFn from the appropriate authAPI.
 *
 * Usage:
 *   import EmailVerificationBanner from '../../components/common/EmailVerificationBanner';
 *   import { patientAuthAPI } from '../../api/services';
 *   <EmailVerificationBanner user={user} resendFn={patientAuthAPI.resendVerification} />
 */

import { useState } from 'react';
import { Mail, X, RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

export default function EmailVerificationBanner({ user, resendFn }) {
  const [dismissed, setDismissed] = useState(false);
  const [sending,   setSending]   = useState(false);
  const [sent,      setSent]      = useState(false);

  // Nothing to show if already verified or user hasn't loaded yet
  if (!user || user.email_verified_at || dismissed) return null;

  const resend = async () => {
    setSending(true);
    try {
      await resendFn();
      setSent(true);
      toast.success('Verification email sent! Check your inbox.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send email. Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: '#FFFBEB',
      border: '1px solid #FDE68A',
      borderRadius: 10,
      padding: '12px 16px',
      marginBottom: 20,
      flexWrap: 'wrap',
    }}>
      {/* Icon */}
      <div style={{
        background: '#FEF3C7',
        borderRadius: 8,
        padding: '6px 8px',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <Mail size={18} color="#D97706" />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 200 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#92400E' }}>
          Please verify your email address
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#B45309' }}>
          We sent a link to <strong>{user.email}</strong>. Check your inbox (and spam folder).
        </p>
      </div>

      {/* Resend button */}
      {!sent ? (
        <button
          onClick={resend}
          disabled={sending}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#D97706',
            color: '#fff',
            border: 'none',
            borderRadius: 7,
            padding: '7px 14px',
            fontSize: 12,
            fontWeight: 600,
            cursor: sending ? 'not-allowed' : 'pointer',
            opacity: sending ? 0.7 : 1,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <RefreshCw size={13} style={sending ? { animation: 'spin 1s linear infinite' } : {}} />
          {sending ? 'Sending…' : 'Resend email'}
        </button>
      ) : (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 12,
          fontWeight: 600,
          color: '#16A34A',
          flexShrink: 0,
        }}>
          <CheckCircle size={14} /> Sent!
        </span>
      )}

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          color: '#B45309',
          flexShrink: 0,
        }}
        title="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  );
}
