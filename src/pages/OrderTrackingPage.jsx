import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search, Package, Truck, CheckCircle, Clock,
  MapPin, Phone, CreditCard, ShoppingBag, AlertCircle,
  ChevronRight, Pill, RefreshCw
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import { guestAPI } from '../api/services';

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'delivered'];

const STEP_META = {
  pending:    { label: 'Order Placed',    icon: Package,      color: '#CA8A04', bg: '#FEF9C3' },
  processing: { label: 'Processing',      icon: RefreshCw,    color: '#2563EB', bg: '#DBEAFE' },
  shipped:    { label: 'Shipped',         icon: Truck,        color: '#7C3AED', bg: '#F5F3FF' },
  delivered:  { label: 'Delivered',       icon: CheckCircle,  color: '#16A34A', bg: '#DCFCE7' },
};

function StatusTimeline({ status, isCancelled }) {
  if (isCancelled) {
    return (
      <div style={{
        background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12,
        padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <AlertCircle size={28} color="#DC2626" />
        <div>
          <p style={{ fontWeight: 800, fontSize: 16, color: '#DC2626' }}>Order Cancelled</p>
          <p style={{ fontSize: 13, color: '#991B1B', marginTop: 2 }}>
            This order has been cancelled. If you paid, please contact support for a refund.
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = STATUS_STEPS.indexOf(status);

  return (
    <div style={{ padding: '8px 0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, position: 'relative' }}>
        {STATUS_STEPS.map((step, index) => {
          const meta      = STEP_META[step];
          const Icon      = meta.icon;
          const completed = index <= currentIndex;
          const current   = index === currentIndex;
          const isLast    = index === STATUS_STEPS.length - 1;

          return (
            <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              {/* Connector line */}
              {!isLast && (
                <div style={{
                  position: 'absolute',
                  top: 18,
                  left: '50%',
                  width: '100%',
                  height: 3,
                  background: index < currentIndex ? meta.color : '#E5E7EB',
                  transition: 'background .3s',
                  zIndex: 0,
                }} />
              )}

              {/* Step circle */}
              <div style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: completed ? meta.color : 'white',
                border: `3px solid ${completed ? meta.color : '#D1D5DB'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
                position: 'relative',
                boxShadow: current ? `0 0 0 4px ${meta.bg}` : 'none',
                transition: 'all .3s',
                flexShrink: 0,
              }}>
                <Icon size={16} color={completed ? 'white' : '#9CA3AF'} />
              </div>

              {/* Label */}
              <p style={{
                fontSize: 11,
                fontWeight: current ? 800 : completed ? 600 : 400,
                color: current ? meta.color : completed ? '#374151' : '#9CA3AF',
                marginTop: 8,
                textAlign: 'center',
                lineHeight: 1.3,
              }}>
                {meta.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  const [searchParams] = useSearchParams();

  const [orderNumber, setOrderNumber] = useState(searchParams.get('order')  || '');
  const [phone,       setPhone]       = useState(searchParams.get('phone')  || '');
  const [loading,     setLoading]     = useState(false);
  const [order,       setOrder]       = useState(null);
  const [error,       setError]       = useState('');

  // Auto-search if URL params are pre-filled (from order confirmation redirect)
  useEffect(() => {
    if (searchParams.get('order') && searchParams.get('phone')) {
      handleTrack();
    }
  }, []); // eslint-disable-line

  const handleTrack = async () => {
    if (!orderNumber.trim()) { setError('Please enter your order number'); return; }
    if (!phone.trim())       { setError('Please enter your phone number'); return; }

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const res = await guestAPI.trackOrder({
        order_number: orderNumber.trim(),
        phone:        phone.trim(),
      });
      setOrder(res.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'No order found with those details. Please check your order number and phone number.'
      );
    } finally {
      setLoading(false);
    }
  };

  const paymentStatusColor = (status) =>
    status === 'paid'     ? '#16A34A' :
    status === 'refunded' ? '#7C3AED' : '#CA8A04';

  const paymentStatusBg = (status) =>
    status === 'paid'     ? '#DCFCE7' :
    status === 'refunded' ? '#F5F3FF' : '#FEF9C3';

  return (
    <Layout>
      <div className="pd-container pd-section" style={{ maxWidth: 680 }}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, color: 'var(--gray-400)' }}>
            <Link to="/" style={{ color: 'var(--gray-400)', textDecoration: 'none' }}>Home</Link>
            <ChevronRight size={13} />
            <span style={{ color: 'var(--gray-700)', fontWeight: 600 }}>Track Order</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--gray-800)', marginBottom: 6 }}>
            Track Your Order
          </h1>
          <p style={{ fontSize: 14, color: 'var(--gray-400)', lineHeight: 1.6 }}>
            Enter your order number and the phone number used at checkout to track your delivery.
          </p>
        </div>

        {/* Search card */}
        <div style={{
          background: 'white',
          border: '1px solid var(--gray-200)',
          borderRadius: 16,
          padding: '24px',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--gray-600)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .5 }}>
                Order Number
              </label>
              <input
                type="text"
                placeholder="e.g. ORD-ABC123XYZ"
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTrack()}
                style={{
                  width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 10,
                  padding: '11px 14px', fontSize: 14, outline: 'none',
                  fontFamily: 'monospace', letterSpacing: 1,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--gray-600)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .5 }}>
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="Phone number used at checkout"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTrack()}
                style={{
                  width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 10,
                  padding: '11px 14px', fontSize: 14, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
                padding: '10px 14px', fontSize: 13, color: '#DC2626',
              }}>
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              onClick={handleTrack}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'var(--primary)', color: 'white',
                border: 'none', borderRadius: 10, padding: '13px 24px',
                fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? .7 : 1, transition: 'opacity .15s',
              }}>
              {loading
                ? <><span className="auth-spinner" /> Tracking...</>
                : <><Search size={16} /> Track Order</>
              }
            </button>
          </div>
        </div>

        {/* Results */}
        {order && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Order header */}
            <div style={{
              background: 'white', border: '1px solid var(--gray-200)',
              borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Order Number</p>
                  <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', fontFamily: 'monospace', letterSpacing: 1 }}>
                    {order.order_number}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>Placed: {order.placed_at}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--gray-800)' }}>
                    Rs. {Number(order.total_amount).toLocaleString()}
                  </p>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                      background: paymentStatusBg(order.payment_status),
                      color: paymentStatusColor(order.payment_status),
                      textTransform: 'capitalize',
                    }}>
                      {order.payment_status}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                      background: '#F3F4F6', color: '#374151', textTransform: 'capitalize',
                    }}>
                      {order.payment_method?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status timeline */}
              <StatusTimeline status={order.status} isCancelled={order.is_cancelled} />

              {order.delivered_at && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#DCFCE7', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, color: '#16A34A', marginTop: 12 }}>
                  <CheckCircle size={14} /> Delivered on {order.delivered_at}
                </div>
              )}
            </div>

            {/* Order items */}
            <div style={{
              background: 'white', border: '1px solid var(--gray-200)',
              borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-sm)',
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 14 }}>
                Order Items
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'var(--gray-50)', borderRadius: 10, padding: '10px 14px',
                    border: '1px solid var(--gray-200)', flexWrap: 'wrap', gap: 8,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Pill size={15} color="var(--primary)" />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</p>
                        {item.brand && <p style={{ fontSize: 11, color: 'var(--gray-400)' }}>{item.brand}</p>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>Qty: {item.quantity} × Rs. {Number(item.unit_price).toLocaleString()}</p>
                      <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--primary)' }}>Rs. {Number(item.subtotal).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order totals */}
              <div style={{ borderTop: '1px solid var(--gray-200)', marginTop: 14, paddingTop: 14 }}>
                {Number(order.delivery_fee) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--gray-500)', marginBottom: 6 }}>
                    <span>Subtotal</span><span>Rs. {Number(order.subtotal).toLocaleString()}</span>
                  </div>
                )}
                {Number(order.delivery_fee) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--gray-500)', marginBottom: 6 }}>
                    <span>Delivery Fee</span><span>Rs. {Number(order.delivery_fee).toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15, color: 'var(--gray-800)' }}>
                  <span>Total</span><span>Rs. {Number(order.total_amount).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Delivery info */}
            <div style={{
              background: 'white', border: '1px solid var(--gray-200)',
              borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-sm)',
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 14 }}>
                Delivery Information
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {order.guest_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--gray-700)' }}>
                    <ShoppingBag size={15} color="var(--primary)" />
                    <span><strong>Customer:</strong> {order.guest_name}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--gray-700)' }}>
                  <MapPin size={15} color="var(--primary)" />
                  <span>{order.delivery_address}{order.delivery_city ? `, ${order.delivery_city}` : ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--gray-700)' }}>
                  <Phone size={15} color="var(--primary)" />
                  <span>{order.delivery_phone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--gray-700)' }}>
                  <CreditCard size={15} color="var(--primary)" />
                  <span>
                    {order.payment_method === 'cod' ? 'Cash on Delivery' :
                     order.payment_method === 'jazzcash' ? 'JazzCash' :
                     order.payment_method === 'bank' ? 'Bank Transfer' :
                     order.payment_method}
                  </span>
                </div>
              </div>
            </div>

            {/* CTA for guest — encourage account creation */}
            {order.is_guest && (
              <div style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, #1D4ED8 100%)',
                borderRadius: 16, padding: 24, color: 'white', textAlign: 'center',
              }}>
                <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>
                  Create a free account
                </h3>
                <p style={{ fontSize: 13, opacity: .85, marginBottom: 16, lineHeight: 1.6 }}>
                  Get a PhysioDesk account to track all orders, book doctor consultations,
                  get prescriptions, and order Rx medicines.
                </p>
                <Link to="/register/patient" style={{
                  display: 'inline-block', background: 'white', color: 'var(--primary)',
                  padding: '10px 24px', borderRadius: 10, fontWeight: 800, fontSize: 13,
                  textDecoration: 'none',
                }}>
                  Create Account — Free
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Bottom: browse pharmacy */}
        {!order && !loading && (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Link to="/pharmacy" style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              <ShoppingBag size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Browse medicines
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
