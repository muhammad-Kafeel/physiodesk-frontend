import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, RefreshCw, Calendar, ShoppingBag, Truck } from 'lucide-react';
import Layout from '../components/layout/Layout';

/**
 * Universal payment result page — handles patient AND guest payments.
 *
 * JazzCash callback redirects here with:
 *   Patient:  ?status=success&type=order&id={orderId}
 *   Guest:    ?status=success&type=order&guest=1&order_number=ORD-xxx&phone=03xx
 */
export default function PaymentResultPage() {
  const [params] = useSearchParams();

  const status      = params.get('status');
  const type        = params.get('type') || 'appointment';
  const id          = params.get('id');
  const reason      = params.get('reason');
  const isGuest     = params.get('guest') === '1';
  const orderNumber = params.get('order_number');
  const phone       = params.get('phone');

  const isSuccess = status === 'success';

  // For guest orders: link to track-order page
  // For patient orders: link to patient orders/appointments page
  const primaryLink  = isGuest && isSuccess && orderNumber
    ? `/track-order?order=${orderNumber}&phone=${encodeURIComponent(phone || '')}`
    : type === 'order' ? '/patient/orders' : '/patient/appointments';

  const primaryLabel = isGuest && isSuccess
    ? 'Track My Order'
    : type === 'order' ? 'My Orders' : 'My Appointments';

  const PrimaryIcon = isGuest && isSuccess ? Truck
    : type === 'order' ? ShoppingBag : Calendar;

  return (
    <Layout>
      <div className="pd-container pd-section" style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          background: 'white',
          border: '1px solid var(--gray-200)',
          borderRadius: 16,
          padding: '48px 40px',
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {isSuccess
            ? <CheckCircle size={64} color="#16A34A" style={{ marginBottom: 20 }} />
            : <XCircle    size={64} color="#DC2626" style={{ marginBottom: 20 }} />
          }

          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: 'var(--gray-800)' }}>
            {isSuccess ? 'Payment Successful' : 'Payment Failed'}
          </h2>

          <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 28, lineHeight: 1.7 }}>
            {isSuccess
              ? isGuest
                  ? `Your order ${orderNumber ? `(${orderNumber})` : ''} has been paid and is now being processed.`
                  : type === 'order'
                      ? 'Your order has been placed and is now being processed.'
                      : 'Your appointment is confirmed. The doctor will join at the scheduled time.'
              : reason || 'Your payment could not be completed. Please try again.'}
          </p>

          {/* Guest: show order number prominently */}
          {isGuest && isSuccess && orderNumber && (
            <div style={{
              background: 'var(--gray-50)', border: '2px dashed var(--primary)',
              borderRadius: 12, padding: '14px 16px', marginBottom: 24, textAlign: 'center',
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Order Number</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', fontFamily: 'monospace', letterSpacing: 1 }}>{orderNumber}</p>
              <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>Save this to track your delivery</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to={primaryLink} style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'var(--primary)', color: '#fff', padding: '12px 24px',
              borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 700,
            }}>
              <PrimaryIcon size={16} />
              {primaryLabel}
            </Link>

            {!isSuccess && (
              <>
                {isGuest && orderNumber ? (
                  <Link to={`/pharmacy`} style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    border: '1px solid var(--gray-200)', color: 'var(--gray-700)', padding: '10px 24px',
                    borderRadius: 10, textDecoration: 'none', fontSize: 14,
                  }}>
                    <RefreshCw size={15} /> Try Again
                  </Link>
                ) : id && (
                  <Link to={type === 'order' ? `/patient/orders` : `/payment/appointment/${id}`} style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    border: '1px solid var(--gray-200)', color: 'var(--gray-700)', padding: '10px 24px',
                    borderRadius: 10, textDecoration: 'none', fontSize: 14,
                  }}>
                    <RefreshCw size={15} /> Try Again
                  </Link>
                )}
              </>
            )}

            <Link to="/" style={{ fontSize: 13, color: 'var(--gray-400)', textDecoration: 'none', marginTop: 4 }}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
