import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, RefreshCw, Calendar, ShoppingBag } from 'lucide-react';
import Layout from '../components/layout/Layout';

/**
 * F02 — Universal payment result page.
 * JazzCash callback redirects to /payment/result?status=success|failed&type=appointment|order&id=...
 * Both success and failure states are handled here.
 */
export default function PaymentResultPage() {
  const [params] = useSearchParams();
  const status = params.get('status');
  const type   = params.get('type') || 'appointment';
  const id     = params.get('id');
  const reason = params.get('reason');

  const isSuccess = status === 'success';

  const backLink = type === 'order'
    ? '/patient/orders'
    : '/patient/appointments';

  const backLabel = type === 'order' ? 'My Orders' : 'My Appointments';
  const BackIcon  = type === 'order' ? ShoppingBag : Calendar;

  return (
    <Layout>
      <div className="pd-container pd-section" style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          background: 'var(--color-bg, #fff)',
          border: '0.5px solid var(--color-border, #e5e7eb)',
          borderRadius: 16,
          padding: '48px 40px',
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          {isSuccess ? (
            <CheckCircle size={64} color="#16A34A" style={{ marginBottom: 20 }} />
          ) : (
            <XCircle size={64} color="#DC2626" style={{ marginBottom: 20 }} />
          )}

          <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 8, color: 'var(--color-text-primary)' }}>
            {isSuccess ? 'Payment Successful' : 'Payment Failed'}
          </h2>

          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
            {isSuccess
              ? type === 'order'
                ? 'Your order has been placed and is now being processed.'
                : 'Your appointment is confirmed. The doctor will join at the scheduled time.'
              : reason || 'Your payment could not be completed. Please try again.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link
              to={backLink}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: '#2563EB', color: '#fff', padding: '11px 24px',
                borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500,
              }}>
              <BackIcon size={16} />
              {backLabel}
            </Link>

            {!isSuccess && id && (
              <Link
                to={type === 'order' ? `/payment/order/${id}` : `/payment/appointment/${id}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  border: '1px solid #d1d5db', color: '#374151', padding: '10px 24px',
                  borderRadius: 8, textDecoration: 'none', fontSize: 14,
                }}>
                <RefreshCw size={15} />
                Try Again
              </Link>
            )}

            <Link to="/" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none', marginTop: 4 }}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
