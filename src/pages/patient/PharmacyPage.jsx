import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShoppingCart, Search, Plus, Minus, Trash2, ShoppingBag, Pill, X } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { pharmacyAPI, paymentAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './PharmacyPage.css';

const CATEGORIES = ['All','Pain Relief','Vitamins','Physiotherapy','First Aid','Digestive','Anti-inflammatory','Muscle Relaxant','Nerve Pain','Corticosteroid'];

export default function PharmacyPage() {
  const [medicines, setMedicines] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [category,  setCategory]  = useState('All');
  const [cart,      setCart]      = useState([]);
  const [cartOpen,  setCartOpen]  = useState(false);
  const [ordering,  setOrdering]  = useState(false);
  const [delivery,  setDelivery]  = useState({ address:'', city:'', phone:'' });
  const [method,    setMethod]    = useState('cod');
  const { user }                  = useAuth();
  const [searchParams]            = useSearchParams();

  useEffect(() => {
    pharmacyAPI.getMedicines({ search, category: category !== 'All' ? category : undefined })
      .then(r => setMedicines(r.data.data.data || []))
      .catch(() => setMedicines([]))
      .finally(() => setLoading(false));
  }, [search, category]);

  // Pre-load the cart from a prescription when arriving via "Order These Medicines".
  const prescriptionId = searchParams.get('prescription');
  useEffect(() => {
    if (!prescriptionId) return;
    pharmacyAPI.previewPrescription(prescriptionId)
      .then(r => {
        const d = r.data.data;
        const inStock = (d.available_items || []).filter(it => it.in_stock);
        if (inStock.length === 0) {
          toast.info('None of the prescribed medicines are currently in stock.');
          return;
        }
        setCart(inStock.map(it => ({
          id:       it.medicine.id,
          name:     it.medicine.name,
          brand:    it.medicine.brand,
          price:    it.medicine.price,
          unit:     it.medicine.unit,
          quantity: it.medicine.quantity,
          qty:      1,
        })));
        setCartOpen(true);
        const missing = [
          ...(d.unavailable_items || []).map(u => u.prescribed_name),
          ...(d.available_items || []).filter(it => !it.in_stock).map(it => it.prescribed_name),
        ];
        if (missing.length) {
          toast.info(`Added in-stock items. Not available: ${missing.join(', ')}`);
        } else {
          toast.success('Prescribed medicines added to your cart');
        }
      })
      .catch(() => toast.error('Could not load prescription medicines'));
  }, [prescriptionId]);

  const addToCart = (med) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === med.id);
      if (ex) return prev.map(i => i.id === med.id ? {...i, qty: i.qty+1} : i);
      return [...prev, {...med, qty:1}];
    });
    toast.success(`${med.name} added to cart`);
    setCartOpen(true);
  };

  const updateQty = (id, delta) =>
    setCart(prev => prev.map(i => i.id === id ? {...i, qty: Math.max(1, i.qty+delta)} : i));

  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const placeOrder = async () => {
    if (!user) { toast.error('Please login first'); return; }
    if (cart.length === 0) { toast.error('Your cart is empty'); return; }
    if (!delivery.address.trim()) { toast.error('Please enter delivery address'); return; }
    if (!delivery.city.trim())    { toast.error('Please enter your city'); return; }
    if (!delivery.phone.trim())   { toast.error('Please enter contact number'); return; }

    setOrdering(true);
    try {
      // ✅ Send correct field names matching backend validation rules
      const res = await pharmacyAPI.placeOrder({
        items:            cart.map(i => ({ medicine_id: i.id, quantity: i.qty })),
        delivery_address: delivery.address,
        delivery_city:    delivery.city,
        delivery_phone:   delivery.phone,
      });

      // Pay for order
      await paymentAPI.payOrder(res.data.data.id, { method });

      toast.success('Order placed successfully!');
      setCart([]);
      setCartOpen(false);
      setDelivery({ address:'', city:'', phone:'' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Order failed';
      toast.error(msg);
    } finally {
      setOrdering(false);
    }
  };

  return (
    <Layout>
      <div className="pd-container pd-section">

        {/* Header */}
        <div className="ph-header">
          <div>
            <h1 className="ph-title">PhysioDesk Pharmacy</h1>
            <p className="ph-sub">Order medicines online — OTC & prescription medicines delivered to your door</p>
          </div>
          <button className="ph-cart-btn" onClick={() => setCartOpen(true)}>
            <ShoppingCart size={18}/>
            Cart
            {cart.length > 0 && (
              <span className="ph-cart-badge">{cart.reduce((s,i)=>s+i.qty,0)}</span>
            )}
          </button>
        </div>

        {/* Search & categories */}
        <div className="ph-controls">
          <div className="ph-search">
            <Search size={15} color="var(--gray-400)"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search medicines..." />
          </div>
          <div className="ph-cats">
            {CATEGORIES.map(c => (
              <button key={c}
                className={`ph-cat-btn ${category === c ? 'active' : ''}`}
                onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Medicine grid */}
        {loading ? <div className="pd-spinner"/> : (
          medicines.length === 0 ? (
            <div className="pd-empty">
              <Pill size={48}/>
              <p>No medicines found</p>
            </div>
          ) : (
            <div className="ph-grid">
              {medicines.map(med => (
                <div key={med.id} className="ph-med-card">
                  <div className="ph-med-img">
                    {med.image
                      ? <img src={`http://localhost:8000/storage/${med.image}`} alt={med.name}/>
                      : <Pill size={36} color="var(--primary)"/>
                    }
                    {med.requires_prescription && (
                      <span className="ph-rx-badge">Rx Required</span>
                    )}
                  </div>
                  <div className="ph-med-info">
                    <p className="ph-med-name">{med.name}</p>
                    <p className="ph-med-brand">{med.brand}</p>
                    <p className="ph-med-cat">{med.category} · {med.unit}</p>
                    <div className="ph-med-bottom">
                      <p className="ph-med-price">Rs. {Number(med.price).toLocaleString()}</p>
                      <button className="ph-add-btn"
                        onClick={() => addToCart(med)}
                        disabled={med.quantity === 0}>
                        {med.quantity === 0 ? 'Out of Stock' : '+ Add'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Cart drawer */}
        {cartOpen && (
          <div className="ph-cart-overlay" onClick={() => setCartOpen(false)}>
            <div className="ph-cart-drawer" onClick={e => e.stopPropagation()}>
              <div className="ph-cart-head">
                <p className="ph-cart-title">
                  <ShoppingBag size={18}/> Your Cart ({cart.reduce((s,i)=>s+i.qty,0)} items)
                </p>
                <button className="ph-cart-close" onClick={() => setCartOpen(false)}>
                  <X size={18}/>
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="pd-empty">
                  <ShoppingCart size={48}/>
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <>
                  {/* Cart items */}
                  <div className="ph-cart-items">
                    {cart.map(item => (
                      <div key={item.id} className="ph-cart-item">
                        <div className="ph-cart-item-info">
                          <p className="ph-cart-item-name">{item.name}</p>
                          <p className="ph-cart-item-price">
                            Rs. {Number(item.price).toLocaleString()} / {item.unit}
                          </p>
                        </div>
                        <div className="ph-qty-ctrl">
                          <button onClick={() => updateQty(item.id, -1)}><Minus size={12}/></button>
                          <span>{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)}><Plus size={12}/></button>
                        </div>
                        <p className="ph-item-sub">
                          Rs. {Number(item.price * item.qty).toLocaleString()}
                        </p>
                        <button className="ph-remove-btn" onClick={() => removeItem(item.id)}>
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Delivery form */}
                  <div className="ph-delivery-form">
                    <p className="ph-delivery-title">Delivery Details</p>
                    <input type="text" placeholder="Full delivery address *"
                      value={delivery.address}
                      onChange={e => setDelivery(p => ({...p, address: e.target.value}))}
                      className="ph-delivery-input"/>
                    <input type="text" placeholder="City *"
                      value={delivery.city}
                      onChange={e => setDelivery(p => ({...p, city: e.target.value}))}
                      className="ph-delivery-input"/>
                    <input type="tel" placeholder="Contact number *"
                      value={delivery.phone}
                      onChange={e => setDelivery(p => ({...p, phone: e.target.value}))}
                      className="ph-delivery-input"/>
                    <select value={method} onChange={e => setMethod(e.target.value)}
                      className="ph-delivery-input">
                      <option value="cod">Cash on Delivery</option>
                      <option value="jazzcash">JazzCash</option>
                      <option value="easypaisa">EasyPaisa</option>
                      <option value="bank">Bank Transfer</option>
                    </select>
                  </div>

                  {/* Footer */}
                  <div className="ph-cart-footer">
                    <div className="ph-cart-total">
                      <span>Total</span>
                      <span className="ph-total-amt">Rs. {Number(total).toLocaleString()}</span>
                    </div>
                    <button className="ba-submit" onClick={placeOrder} disabled={ordering}>
                      {ordering ? <span className="auth-spinner"/> : <><ShoppingCart size={16}/> Place Order</>}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
