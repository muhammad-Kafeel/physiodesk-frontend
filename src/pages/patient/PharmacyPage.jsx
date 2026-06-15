import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Search, Plus, Minus, X, Pill, Lock,
  Package, Truck, User, Phone, Mail, MapPin, AlertCircle,
  Smartphone, Building, CheckCircle, Copy, Clock,
  Upload, CreditCard
} from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { pharmacyAPI, paymentAPI, guestAPI } from '../../api/services';
import { usePatientAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './PharmacyPage.css';

const CATEGORIES = [
  'All','Pain Relief','Vitamins','Physiotherapy','First Aid',
  'Digestive','Anti-inflammatory','Muscle Relaxant','Nerve Pain','Corticosteroid',
];

const GUEST_METHODS = [
  { id:'cod',      label:'Cash on Delivery', icon:<Package size={18} color="#16A34A"/>,  color:'#16A34A', desc:'Pay cash when your order arrives' },
  { id:'jazzcash', label:'JazzCash',          icon:<Smartphone size={18} color="#EF4444"/>, color:'#EF4444', desc:"Redirected to JazzCash to pay instantly" },
  { id:'bank',     label:'Bank Transfer',     icon:<Building size={18} color="#2563EB"/>,  color:'#2563EB', desc:'Transfer to our account, enter reference' },
];
const PATIENT_METHODS = [
  { id:'cod',      label:'Cash on Delivery', icon:<Package size={18} color="#16A34A"/>,  color:'#16A34A', desc:'Pay cash when your order arrives' },
  { id:'jazzcash', label:'JazzCash',          icon:<Smartphone size={18} color="#EF4444"/>, color:'#EF4444', desc:'Pay instantly via JazzCash wallet' },
  { id:'bank',     label:'Bank Transfer',     icon:<Building size={18} color="#2563EB"/>,  color:'#2563EB', desc:'Transfer to our bank account' },
];

export default function PharmacyPage() {
  const { user: patientUser } = usePatientAuth();
  const isGuest               = !patientUser;
  const navigate              = useNavigate();
  const [searchParams]        = useSearchParams();
  const jazzFormRef           = useRef(null);

  const [medicines, setMedicines] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [category,  setCategory]  = useState('All');

  const [cart,     setCart]     = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const [delivery,    setDelivery]    = useState({ address:'', city:'', phone:'' });
  const [guestInfo,   setGuestInfo]   = useState({ name:'', email:'' });
  const [method,      setMethod]      = useState('cod');
  const [bankRef,     setBankRef]     = useState('');
  const [bankReceipt, setBankReceipt] = useState(null);

  const [ordering,     setOrdering]     = useState(false);
  const [orderConfirm, setOrderConfirm] = useState(null);
  const [copiedOrder,  setCopiedOrder]  = useState(false);
  const [jazzFields,   setJazzFields]   = useState(null);
  const [jazzEndpoint, setJazzEndpoint] = useState('');

  useEffect(() => {
    setLoading(true);
    pharmacyAPI.getMedicines({ search, category: category !== 'All' ? category : undefined })
      .then(r => setMedicines(r.data.data.data || []))
      .catch(() => setMedicines([]))
      .finally(() => setLoading(false));
  }, [search, category]);

  useEffect(() => {
    const pid = searchParams.get('prescription');
    if (!pid) return;
    pharmacyAPI.previewPrescription(pid)
      .then(r => {
        const inStock = (r.data.data.available_items || []).filter(it => it.in_stock);
        if (!inStock.length) { toast.info('None of the prescribed medicines are in stock.'); return; }
        setCart(inStock.map(it => ({ id:it.medicine.id, name:it.medicine.name, brand:it.medicine.brand, price:it.medicine.price, unit:it.medicine.unit, quantity:it.medicine.quantity, requires_prescription:true, qty:1 })));
        setCartOpen(true);
      })
      .catch(() => toast.error('Could not load prescription medicines'));
  }, []);

  useEffect(() => {
    if (jazzFields && jazzFormRef.current) {
      const t = setTimeout(() => jazzFormRef.current?.submit(), 500);
      return () => clearTimeout(t);
    }
  }, [jazzFields]);

  const addToCart = (med) => {
    if (isGuest && med.requires_prescription) {
      toast.info('This medicine requires a prescription. Please log in.');
      navigate('/patient/login');
      return;
    }
    setCart(prev => {
      const ex = prev.find(i => i.id === med.id);
      if (ex) return prev.map(i => i.id === med.id ? {...i, qty:i.qty+1} : i);
      return [...prev, {...med, qty:1}];
    });
    toast.success(`${med.name} added to cart`);
    setCartOpen(true);
  };

  const updateQty = (id, delta) =>
    setCart(prev => prev.map(i => i.id === id ? {...i, qty:Math.max(1, i.qty+delta)} : i));

  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const hasRx     = cart.some(i => i.requires_prescription);

  const copyOrder = () => {
    navigator.clipboard.writeText(orderConfirm.order_number);
    setCopiedOrder(true);
    setTimeout(() => setCopiedOrder(false), 2000);
  };

  const validateDelivery = () => {
    if (!delivery.address.trim()) { toast.error('Please enter delivery address'); return false; }
    if (!delivery.city.trim())    { toast.error('Please enter your city'); return false; }
    if (!delivery.phone.trim())   { toast.error('Please enter contact number'); return false; }
    return true;
  };

  const resetForm = () => {
    setDelivery({ address:'', city:'', phone:'' });
    setGuestInfo({ name:'', email:'' });
    setBankRef(''); setBankReceipt(null); setMethod('cod');
  };

  // ── Guest checkout ──────────────────────────────────────────────────────────
  const placeGuestOrder = async () => {
    if (!cart.length)           { toast.error('Your cart is empty'); return; }
    if (!guestInfo.name.trim()) { toast.error('Please enter your full name'); return; }
    if (!validateDelivery())    return;
    const needsEmail = method === 'jazzcash' || method === 'bank';
    if (needsEmail && !guestInfo.email.trim()) {
      toast.error('Email is required for JazzCash and Bank Transfer'); return;
    }
    if (method === 'bank' && !bankRef.trim()) {
      toast.error('Please enter your bank transaction reference number'); return;
    }
    if (hasRx) { toast.error('Rx medicines require a prescription — please log in'); return; }

    setOrdering(true);
    try {
      const fd = new FormData();
      fd.append('guest_name',       guestInfo.name.trim());
      fd.append('guest_email',      guestInfo.email.trim() || '');
      fd.append('payment_method',   method);
      fd.append('delivery_address', delivery.address.trim());
      fd.append('delivery_city',    delivery.city.trim());
      fd.append('delivery_phone',   delivery.phone.trim());
      cart.forEach((item, i) => {
        fd.append(`items[${i}][medicine_id]`, item.id);
        fd.append(`items[${i}][quantity]`,    item.qty);
      });
      if (method === 'bank') {
        fd.append('reference_number', bankRef.trim());
        if (bankReceipt) fd.append('receipt', bankReceipt);
      }

      const res = await guestAPI.placeOrder(fd);
      const data = res.data.data;

      if (method === 'jazzcash') {
        const jr = await guestAPI.initiateJazzCash(data.order_number);
        setJazzEndpoint(jr.data.data.endpoint);
        setJazzFields(jr.data.data.fields);
        setCart([]); setCartOpen(false); resetForm();
      } else {
        setCart([]); setCartOpen(false);
        setOrderConfirm({ order_number:data.order_number, total_amount:data.total_amount, payment_method:method, phone:delivery.phone.trim() });
        resetForm();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed. Please try again.');
    } finally {
      setOrdering(false);
    }
  };

  // ── Patient checkout ────────────────────────────────────────────────────────
  const placePatientOrder = async () => {
    if (!cart.length)        { toast.error('Your cart is empty'); return; }
    if (!validateDelivery()) return;
    if (method === 'bank' && !bankRef.trim()) {
      toast.error('Please enter your bank transaction reference number'); return;
    }
    setOrdering(true);
    try {
      const orderRes = await pharmacyAPI.placeOrder({
        items:            cart.map(i => ({ medicine_id:i.id, quantity:i.qty })),
        delivery_address: delivery.address.trim(),
        delivery_city:    delivery.city.trim(),
        delivery_phone:   delivery.phone.trim(),
      });
      const orderId = orderRes.data.data.id;

      if (method === 'jazzcash') {
        const jr = await paymentAPI.initiateJazzCashOrder(orderId);
        setJazzEndpoint(jr.data.data.endpoint);
        setJazzFields(jr.data.data.fields);
        setCart([]); setCartOpen(false);
      } else {
        const form = new FormData();
        form.append('method', method);
        if (method === 'bank') {
          form.append('reference_number', bankRef.trim());
          if (bankReceipt) form.append('receipt', bankReceipt);
        }
        await paymentAPI.payOrder(orderId, form, { headers:{'Content-Type':'multipart/form-data'} });
        setCart([]); setCartOpen(false); resetForm();
        toast.success(method === 'cod' ? 'Order placed! Pay cash on delivery.' : 'Order placed! Awaiting payment verification.');
        navigate('/patient/orders');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed. Please try again.');
    } finally {
      setOrdering(false);
    }
  };

  const handleCheckout = isGuest ? placeGuestOrder : placePatientOrder;
  const methods = isGuest ? GUEST_METHODS : PATIENT_METHODS;

  const btnLabel = () => {
    if (ordering) return null;
    if (method === 'jazzcash') return 'Pay with JazzCash';
    if (method === 'bank')     return 'Place Order (Bank Transfer)';
    return 'Place Order';
  };

  return (
    <Layout>
      {/* JazzCash hidden form */}
      {jazzFields && (
        <form ref={jazzFormRef} method="POST" action={jazzEndpoint} style={{display:'none'}}>
          {Object.entries(jazzFields).map(([k,v]) => <input key={k} type="hidden" name={k} value={v}/>)}
        </form>
      )}

      <div className="pd-container pd-section">

        {/* Header */}
        <div className="ph-header">
          <div>
            <h1 className="ph-title">PhysioDesk Pharmacy</h1>
            <p className="ph-sub">
              {isGuest
                ? 'Order OTC medicines — no account needed. COD, JazzCash & Bank Transfer available.'
                : 'Order medicines — OTC & Rx delivered to your door'}
            </p>
          </div>
          <div style={{display:'flex', gap:10, alignItems:'center', flexWrap:'wrap'}}>
            {isGuest ? (
              <Link to="/patient/login" className="ph-login-hint-btn">
                <Lock size={14}/> Login for Rx Medicines
              </Link>
            ) : (
              <Link to="/patient/orders" className="ph-login-hint-btn" style={{background:'var(--gray-100)',color:'var(--gray-700)'}}>
                <Package size={14}/> My Orders
              </Link>
            )}
            <button className="ph-cart-btn" onClick={() => setCartOpen(true)}>
              <ShoppingCart size={18}/> Cart
              {cartCount > 0 && <span className="ph-cart-badge">{cartCount}</span>}
            </button>
          </div>
        </div>

        {/* Search + categories */}
        <div className="ph-controls">
          <div className="ph-search">
            <Search size={15} color="var(--gray-400)"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search medicines..."/>
          </div>
          <div className="ph-cats">
            {CATEGORIES.map(c => (
              <button key={c} className={`ph-cat-btn ${category===c?'active':''}`} onClick={() => setCategory(c)}>{c}</button>
            ))}
          </div>
        </div>

        {isGuest && (
          <div className="ph-guest-info-bar">
            <Package size={15} color="var(--primary)"/>
            <span>
              <strong>No account needed</strong> — buy OTC medicines with COD, JazzCash, or Bank Transfer.&nbsp;
              <Link to="/patient/login" style={{color:'var(--primary)',fontWeight:700}}>Login</Link> to order Rx medicines.
            </span>
          </div>
        )}

        {/* Medicine grid */}
        {loading ? <div className="pd-spinner"/> : medicines.length === 0 ? (
          <div className="pd-empty"><Pill size={48}/><p>No medicines found</p></div>
        ) : (
          <div className="ph-grid">
            {medicines.map(med => {
              const needsLogin = isGuest && med.requires_prescription;
              return (
                <div key={med.id} className="ph-med-card">
                  <div className="ph-med-img">
                    {med.image ? <img src={`http://localhost:8000/storage/${med.image}`} alt={med.name}/> : <Pill size={36} color="var(--primary)"/>}
                    {med.requires_prescription && (
                      <span className="ph-rx-badge">{isGuest ? <><Lock size={9}/> Rx — Login</> : 'Rx Required'}</span>
                    )}
                  </div>
                  <div className="ph-med-info">
                    <p className="ph-med-name">{med.name}</p>
                    <p className="ph-med-brand">{med.brand}</p>
                    <p className="ph-med-cat">{med.category} · {med.unit}</p>
                    <div className="ph-med-bottom">
                      <p className="ph-med-price">Rs. {Number(med.price).toLocaleString()}</p>
                      <button
                        className={`ph-add-btn ${needsLogin?'ph-add-btn--login':''}`}
                        onClick={() => needsLogin ? navigate('/patient/login') : addToCart(med)}
                        disabled={med.quantity === 0}>
                        {med.quantity === 0 ? 'Out of Stock' : needsLogin ? <><Lock size={11}/> Login to Buy</> : '+ Add'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ CART DRAWER ═══════════════════════════════════════════════ */}
      {cartOpen && (
        <div className="ph-cart-overlay" onClick={() => setCartOpen(false)}>
          <div className="ph-cart-drawer" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="ph-cart-head">
              <p className="ph-cart-title">
                <ShoppingCart size={18}/>
                Your Cart
                {cartCount > 0 && <span className="ph-cart-count">{cartCount} {cartCount===1?'item':'items'}</span>}
              </p>
              <button className="ph-cart-close" onClick={() => setCartOpen(false)}>
                <X size={16}/>
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="pd-empty" style={{flex:1, padding:'60px 20px'}}>
                <ShoppingCart size={48} color="var(--gray-300)"/>
                <p style={{marginTop:12, color:'var(--gray-400)'}}>Your cart is empty</p>
                <button onClick={() => setCartOpen(false)} style={{marginTop:16, background:'var(--primary)', color:'white', border:'none', borderRadius:8, padding:'8px 20px', fontSize:13, fontWeight:700, cursor:'pointer'}}>
                  Browse Medicines
                </button>
              </div>
            ) : (
              <>
                {/* ── Scrollable body ── */}
                <div className="ph-cart-body">

                  {/* Cart items */}
                  <div className="ph-cart-items">
                    {cart.map(item => (
                      <div key={item.id} className="ph-ci">
                        <div className="ph-ci-thumb">
                          <Pill size={18} color="white"/>
                        </div>
                        <div className="ph-ci-body">
                          <div className="ph-ci-top">
                            <p className="ph-ci-name">
                              {item.name}
                              {item.requires_prescription && <span className="ph-ci-rx">Rx</span>}
                            </p>
                            <button className="ph-ci-del" onClick={() => removeItem(item.id)}>
                              <X size={14}/>
                            </button>
                          </div>
                          <p className="ph-ci-meta">
                            {[item.brand, item.unit].filter(Boolean).join(' · ')}
                          </p>
                          <div className="ph-ci-foot">
                            <div className="ph-qty">
                              <button onClick={() => updateQty(item.id, -1)}><Minus size={12}/></button>
                              <span>{item.qty}</span>
                              <button onClick={() => updateQty(item.id, 1)}><Plus size={12}/></button>
                            </div>
                            <p className="ph-ci-sub">Rs. {Number(item.price * item.qty).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Rx warning */}
                  {isGuest && hasRx && (
                    <div className="ph-rx-warning">
                      <AlertCircle size={14} color="#D97706"/>
                      <span>Rx medicines need a prescription.&nbsp;<Link to="/patient/login" style={{color:'var(--primary)',fontWeight:700}}>Log in</Link> to order them.</span>
                    </div>
                  )}

                  {/* ── Checkout form ── */}
                  <div className="ph-form">

                    {/* Your Details (guest only) */}
                    {isGuest && (
                      <div className="ph-section">
                        <div className="ph-section-title">
                          <User size={12}/> Your Details
                        </div>

                        <div className="ph-field">
                          <label className="ph-label">Full Name <span className="ph-required">*</span></label>
                          <div className="ph-iw">
                            <span className="ph-ii"><User size={13}/></span>
                            <input type="text" className="ph-in icon" placeholder="Muhammad Kafeel"
                              value={guestInfo.name} onChange={e => setGuestInfo(p => ({...p, name:e.target.value}))}/>
                          </div>
                        </div>

                        <div className="ph-field">
                          <label className="ph-label">
                            Email {(method==='jazzcash'||method==='bank') && <span className="ph-required">*</span>}
                            {method==='cod' && <span style={{fontSize:10,color:'#9CA3AF',fontWeight:400,marginLeft:4}}>(optional)</span>}
                          </label>
                          <div className="ph-iw">
                            <span className="ph-ii"><Mail size={13}/></span>
                            <input type="email" className="ph-in icon" placeholder="you@example.com"
                              value={guestInfo.email} onChange={e => setGuestInfo(p => ({...p, email:e.target.value}))}/>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Delivery Details */}
                    <div className="ph-section">
                      <div className="ph-section-title">
                        <MapPin size={12}/> Delivery Details
                      </div>

                      <div className="ph-field">
                        <label className="ph-label">Contact Number <span className="ph-required">*</span></label>
                        <div className="ph-iw">
                          <span className="ph-ii"><Phone size={13}/></span>
                          <input type="tel" className="ph-in icon" placeholder="03xx-xxxxxxx"
                            value={delivery.phone} onChange={e => setDelivery(p => ({...p, phone:e.target.value}))}/>
                        </div>
                      </div>

                      <div className="ph-field">
                        <label className="ph-label">Delivery Address <span className="ph-required">*</span></label>
                        <input type="text" className="ph-in" placeholder="House / Street / Area"
                          value={delivery.address} onChange={e => setDelivery(p => ({...p, address:e.target.value}))}/>
                      </div>

                      <div className="ph-field">
                        <label className="ph-label">City <span className="ph-required">*</span></label>
                        <input type="text" className="ph-in" placeholder="Lahore"
                          value={delivery.city} onChange={e => setDelivery(p => ({...p, city:e.target.value}))}/>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="ph-section">
                      <div className="ph-section-title">
                        <CreditCard size={12}/> Payment Method
                      </div>

                      <div className="ph-pay-list">
                        {methods.map(m => (
                          <div key={m.id} className={`ph-pay-card ${method===m.id?'active':''}`}
                            onClick={() => setMethod(m.id)}>

                            {/* Card header row */}
                            <div className="ph-pay-row">
                              <div className="ph-pay-radio-wrap">
                                <div className="ph-pay-radio-dot"/>
                              </div>
                              <span className="ph-pay-ico">{m.icon}</span>
                              <div className="ph-pay-info">
                                <p className="ph-pay-name">{m.label}</p>
                                <p className="ph-pay-desc">{m.desc}</p>
                              </div>
                              {method===m.id && <CheckCircle size={16} className="ph-pay-check"/>}
                            </div>

                            {/* Expanded content */}
                            {method===m.id && m.id==='jazzcash' && (
                              <div className="ph-pay-expand">
                                <div className="ph-jazz-notice">
                                  <Smartphone size={14} color="#EF4444"/>
                                  <span>After placing your order, you'll be securely redirected to JazzCash. Complete the payment there and you'll be brought back automatically.</span>
                                </div>
                              </div>
                            )}

                            {method===m.id && m.id==='bank' && (
                              <div className="ph-pay-expand">
                                {/* Bank info card */}
                                <div className="ph-bank-card">
                                  <div className="ph-bank-header">
                                    <Building size={12}/> Transfer to
                                  </div>
                                  <div className="ph-bank-body">
                                    <div className="ph-bank-row">
                                      <span className="ph-bank-key">Bank</span>
                                      <span className="ph-bank-val name">{import.meta.env.VITE_BANK_NAME||'HBL'}</span>
                                    </div>
                                    <div className="ph-bank-row">
                                      <span className="ph-bank-key">Account</span>
                                      <span className="ph-bank-val">{import.meta.env.VITE_BANK_ACCOUNT||'—'}</span>
                                    </div>
                                    <div className="ph-bank-row">
                                      <span className="ph-bank-key">Title</span>
                                      <span className="ph-bank-val name">{import.meta.env.VITE_BANK_TITLE||'PhysioDesk Pvt Ltd'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Reference input */}
                                <div className="ph-field" style={{marginBottom:0}}>
                                  <label className="ph-label">Transaction Reference <span className="ph-required">*</span></label>
                                  <input type="text" className="ph-in" placeholder="e.g. TXN-123456789"
                                    value={bankRef} onChange={e => setBankRef(e.target.value)}
                                    onClick={e => e.stopPropagation()}/>
                                </div>

                                {/* File upload */}
                                <div>
                                  <label className="ph-label">Receipt <span style={{fontSize:10,color:'#9CA3AF',fontWeight:400}}>optional</span></label>
                                  <div className="ph-upload" onClick={e => e.stopPropagation()}>
                                    <label className="ph-upload-label">
                                      <Upload size={14} color="#6B7280"/>
                                      {bankReceipt ? bankReceipt.name : 'Click to upload receipt (JPG, PNG, PDF)'}
                                      <input type="file" accept=".jpg,.jpeg,.png,.pdf"
                                        onChange={e => setBankReceipt(e.target.files?.[0]||null)}/>
                                    </label>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>{/* /ph-form */}
                </div>{/* /ph-cart-body */}

                {/* ── Sticky footer ── */}
                <div className="ph-cart-footer">
                  <div className="ph-foot-total">
                    <div>
                      <p className="ph-foot-label">Order Total</p>
                      <p className="ph-foot-items">{cartCount} item{cartCount!==1?'s':''} · {method==='cod'?'Cash on Delivery':method==='jazzcash'?'JazzCash':'Bank Transfer'}</p>
                    </div>
                    <p className="ph-foot-amt">
                      <span className="ph-foot-curr">Rs.</span>
                      {Number(cartTotal).toLocaleString()}
                    </p>
                  </div>

                  <button
                    className={`ph-order-btn ${method}`}
                    onClick={handleCheckout}
                    disabled={ordering}>
                    {ordering
                      ? <span className="auth-spinner"/>
                      : <>
                          {method==='jazzcash' ? <Smartphone size={16}/> :
                           method==='bank'     ? <Building size={16}/> :
                                                 <Package size={16}/>}
                          {btnLabel()}
                        </>
                    }
                  </button>

                  <p className="ph-foot-hint">
                    {isGuest
                      ? <><Link to="/patient/login">Log in</Link> for faster checkout and Rx medicines</>
                      : 'All transactions are secure and encrypted'
                    }
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══ ORDER CONFIRMATION MODAL ═══════════════════════════════════ */}
      {orderConfirm && (
        <div className="ph-confirm-overlay">
          <div className="ph-confirm-modal">
            <div className="ph-confirm-icon">
              {orderConfirm.payment_method==='bank'
                ? <Clock size={52} color="#2563EB"/>
                : <CheckCircle size={52} color="#16A34A"/>}
            </div>
            <h2 className="ph-confirm-title">
              {orderConfirm.payment_method==='bank' ? 'Order Placed — Pending Verification' : 'Order Placed!'}
            </h2>
            <p className="ph-confirm-sub">
              {orderConfirm.payment_method==='bank'
                ? "We'll process your order once our team verifies your bank transfer, usually within a few hours."
                : 'Your order has been received. Save your order number to track delivery.'}
            </p>

            <div className="ph-order-number-box">
              <p style={{fontSize:11,fontWeight:600,color:'#6B7280',marginBottom:4,textTransform:'uppercase',letterSpacing:1}}>Order Number</p>
              <div className="ph-order-number-row">
                <span className="ph-order-number">{orderConfirm.order_number}</span>
                <button className="ph-copy-btn" onClick={copyOrder}>
                  {copiedOrder ? <CheckCircle size={13} color="#16A34A"/> : <Copy size={13}/>}
                  {copiedOrder ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="ph-confirm-meta">
              <div className="ph-confirm-meta-row">
                <span>Total</span>
                <strong>Rs. {Number(orderConfirm.total_amount).toLocaleString()}</strong>
              </div>
              <div className="ph-confirm-meta-row">
                <span>Payment</span>
                <strong>
                  {orderConfirm.payment_method==='cod'  ? 'Cash on Delivery' :
                   orderConfirm.payment_method==='bank' ? 'Bank Transfer (pending)' :
                   orderConfirm.payment_method}
                </strong>
              </div>
              {orderConfirm.payment_method==='cod' && (
                <div className="ph-confirm-meta-row">
                  <span>Estimated Delivery</span><strong>2–3 business days</strong>
                </div>
              )}
            </div>

            <div className="ph-confirm-actions">
              <Link to={`/track-order?order=${orderConfirm.order_number}&phone=${orderConfirm.phone}`}
                className="ba-submit" style={{textDecoration:'none',textAlign:'center'}}>
                <Truck size={15}/> Track My Order
              </Link>
              <button onClick={() => setOrderConfirm(null)}
                style={{background:'#F3F4F6',color:'#374151',border:'none',borderRadius:10,padding:'11px 20px',fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}>
                Continue Shopping
              </button>
            </div>

            <p style={{fontSize:11,color:'#9CA3AF',marginTop:16,textAlign:'center'}}>
              <Link to="/register/patient" style={{color:'var(--primary)',fontWeight:600}}>Create a free account</Link> to manage orders, get prescriptions & book consultations.
            </p>
          </div>
        </div>
      )}
    </Layout>
  );
}
