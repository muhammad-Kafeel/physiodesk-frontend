import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import './AuthPages.css';

export default function EmailVerifiedPage() {
  const [params] = useSearchParams();
  const ok = params.get('status') === 'success';

  return (
    <div className="ap-page">
      <Link to="/" className="ap-panel" style={{ textDecoration: 'none' }}>
        <div className="ap-wordmark">
          <div className="ap-wordmark-icon">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <rect x="12" y="3" width="2" height="20" rx="1" fill="white"/>
              <rect x="3" y="12" width="20" height="2" rx="1" fill="white"/>
            </svg>
          </div>
          <span className="ap-wordmark-name">PhysioDesk</span>
        </div>
      </Link>

      <div className="ap-side">
        <div className="ap-box" style={{ textAlign: 'center' }}>
          {ok
            ? <CheckCircle size={56} color="#16A34A" style={{ marginBottom: 16 }} />
            : <XCircle size={56} color="#DC2626" style={{ marginBottom: 16 }} />}
          <h1 className="ap-heading">{ok ? 'Email verified' : 'Verification failed'}</h1>
          <p style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.6, marginBottom: 20 }}>
            {ok
              ? 'Your email address has been confirmed. You can now sign in and use all features.'
              : 'This verification link is invalid or has expired. Sign in and request a new link from your dashboard.'}
          </p>
          <Link to="/patient/login" className="ap-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>
            Continue to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
