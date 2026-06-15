import { useState, useEffect } from 'react';
import { MapPin, Phone, CreditCard, User, ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminAPI } from '../../api/services';
import { toast } from 'react-toastify';

// Enum now: pending, processing, shipped, delivered, cancelled
const STATUS_OPTS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const S_STYLE = {
  pending:    { bg: '#FEF9C3', color: '#CA8A04' },
  processing: { bg: '#DBEAFE', color: '#2563EB' },
  shipped:    { bg: '#F5F3FF', color: '#7C3AED' },
  delivered:  { bg: '#DCFCE7', color: '#16A34A' },
  cancelled:  { bg: '#FEE2E2', color: '#DC2626' },
};

const PAY_STYLE = {
  paid:     { bg: '#DCFCE7', color: '#16A34A' },
  unpaid:   { bg: '#FEF9C3', color: '#CA8A04' },
  refunded: { bg: '#F5F3FF', color: '#7C3AED' },
};

export default function ManageOrders() {
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [updating,   setUpdating]   = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [expanded,   setExpanded]   = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    adminAPI.getOrders()
      .then(r  => setOrders(r.data.data.data || []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await adminAPI.updateOrderStatus(id, { status });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      toast.success(`Order marked as ${status}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  // Confirm a pending COD or bank payment
  const confirmPayment = async (paymentId, orderId) => {
    setConfirming(paymentId);
    try {
      await adminAPI.confirmPayment(paymentId);
      setOrders(prev => prev.map(o => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          payment_status: 'paid',
          status: 'processing',
          payment: o.payment ? { ...o.payment, status: 'completed' } : o.payment,
        };
      }));
      toast.success('Payment confirmed — order moved to processing');
    } catch {
      toast.error('Failed to confirm payment');
    } finally {
      setConfirming(null);
    }
  };

  const filtered = filterStatus === 'all'
    ? orders
    : orders.filter(o => o.status === filterStatus);

  const counts = STATUS_OPTS.reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length;
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1100 }}>

        {/* Page header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--gray-800)', marginBottom: 4 }}>
            Manage Orders
          </h1>
          <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>
            View and manage all pharmacy orders — guest and registered-patient orders.
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          {[{ label: 'All', value: 'all', count: orders.length, bg: '#F3F4F6', color: '#374151' },
            ...STATUS_OPTS.map(s => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s, count: counts[s], ...S_STYLE[s] })),
          ].map(item => (
            <button
              key={item.value}
              onClick={() => setFilterStatus(item.value)}
              style={{
                background: filterStatus === item.value ? item.bg : 'white',
                color: filterStatus === item.value ? item.color : 'var(--gray-500)',
                border: `1.5px solid ${filterStatus === item.value ? (item.color || '#374151') : 'var(--gray-200)'}`,
                borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s',
              }}>
              {item.label}
              <span style={{
                background: filterStatus === item.value ? (item.color || '#374151') : 'var(--gray-200)',
                color: filterStatus === item.value ? 'white' : 'var(--gray-600)',
                borderRadius: 99, padding: '1px 7px', fontSize: 11,
              }}>
                {item.count}
              </span>
            </button>
          ))}
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="pd-spinner" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.length === 0 && (
              <div className="pd-empty"><p>No orders in this category</p></div>
            )}

            {filtered.map(o => {
              const s      = S_STYLE[o.status]  || S_STYLE.pending;
              const ps     = PAY_STYLE[o.payment_status] || PAY_STYLE.unpaid;
              const open   = expanded === o.id;
              const isGuest     = !o.patient;
              const customerName = isGuest
                ? (o.guest_name || 'Guest')
                : (o.patient?.user?.name || '—');

              // Show confirm button if payment is pending COD or bank
              const pendingPayment = o.payment?.status === 'pending'
                && ['cod', 'bank'].includes(o.payment?.method);

              return (
                <div key={o.id} style={{
                  background: 'white', border: '1px solid var(--gray-200)',
                  borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
                }}>
                  {/* Order row */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                    cursor: 'pointer', flexWrap: 'wrap',
                  }}
                    onClick={() => setExpanded(open ? null : o.id)}>

                    {/* Left: order info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 700, fontSize: 14 }}>#{o.order_number || `Order ${o.id}`}</p>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: s.bg, color: s.color, textTransform: 'capitalize' }}>
                          {o.status}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: ps.bg, color: ps.color, textTransform: 'capitalize' }}>
                          {o.payment_status}
                        </span>
                        {isGuest && (
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: '#F0FDF4', color: '#15803D', border: '1px solid #86EFAC' }}>
                            GUEST
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--gray-600)' }}>
                        <User size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        {customerName}
                        {o.guest_email && <span style={{ color: 'var(--gray-400)' }}> · {o.guest_email}</span>}
                        <span style={{ color: 'var(--gray-400)' }}> · {o.delivery_city}</span>
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>
                        {new Date(o.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}{o.items?.length || 0} item{o.items?.length !== 1 ? 's' : ''}
                        {o.payment_method && <span> · {o.payment_method.toUpperCase()}</span>}
                      </p>
                    </div>

                    {/* Right: amount + controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--primary)', minWidth: 80, textAlign: 'right' }}>
                        Rs. {Number(o.total_amount).toLocaleString()}
                      </p>

                      {/* Status selector */}
                      <select
                        value={o.status}
                        onChange={e => updateStatus(o.id, e.target.value)}
                        disabled={updating === o.id || o.status === 'cancelled'}
                        onClick={e => e.stopPropagation()}
                        style={{
                          border: '1.5px solid var(--gray-200)', borderRadius: 8,
                          padding: '7px 10px', fontSize: 12, fontWeight: 600,
                          cursor: o.status === 'cancelled' ? 'not-allowed' : 'pointer',
                          outline: 'none', background: 'white',
                        }}>
                        {STATUS_OPTS.map(st => (
                          <option key={st} value={st}>
                            {st.charAt(0).toUpperCase() + st.slice(1)}
                          </option>
                        ))}
                      </select>

                      {open
                        ? <ChevronUp size={16} color="var(--gray-400)" />
                        : <ChevronDown size={16} color="var(--gray-400)" />
                      }
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {open && (
                    <div style={{ borderTop: '1px solid var(--gray-200)', padding: 16, background: 'var(--gray-50)' }}>

                      {/* Payment confirm banner */}
                      {pendingPayment && (
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: 10,
                          padding: '12px 16px', marginBottom: 14, flexWrap: 'wrap', gap: 10,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#92400E' }}>
                            <AlertCircle size={15} color="#D97706" />
                            <span>
                              <strong>{o.payment_method === 'cod' ? 'COD' : 'Bank Transfer'} payment pending.</strong>
                              {' '}Confirm when you have verified the payment.
                            </span>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); confirmPayment(o.payment.id, o.id); }}
                            disabled={confirming === o.payment.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              background: '#16A34A', color: 'white', border: 'none',
                              borderRadius: 8, padding: '8px 16px', fontSize: 12,
                              fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                            }}>
                            {confirming === o.payment.id
                              ? <span className="auth-spinner" />
                              : <><CheckCircle size={13} /> Confirm Payment</>
                            }
                          </button>
                        </div>
                      )}

                      {/* Order items */}
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 10 }}>
                        Items
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                        {(o.items || []).map(item => (
                          <div key={item.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: 'white', padding: '8px 14px', borderRadius: 8,
                            border: '1px solid var(--gray-200)', flexWrap: 'wrap', gap: 6,
                          }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{item.medicine?.name || '—'}</span>
                            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>x{item.quantity}</span>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>
                              Rs. {Number(item.subtotal ?? (item.unit_price * item.quantity)).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Delivery + customer info */}
                      <div style={{
                        display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13,
                        color: 'var(--gray-600)', background: 'white', padding: '12px 16px',
                        borderRadius: 8, border: '1px solid var(--gray-200)',
                      }}>
                        {o.delivery_address && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <MapPin size={13} color="var(--primary)" />
                            {o.delivery_address}{o.delivery_city ? `, ${o.delivery_city}` : ''}
                          </span>
                        )}
                        {o.delivery_phone && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Phone size={13} color="var(--primary)" />
                            {o.delivery_phone}
                          </span>
                        )}
                        {o.payment_method && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <CreditCard size={13} color="var(--primary)" />
                            {o.payment_method.toUpperCase()}
                          </span>
                        )}
                        {o.notes && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--gray-400)', fontStyle: 'italic' }}>
                            {o.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
