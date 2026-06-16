import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Package, MapPin, Phone, ChevronDown, ChevronUp, CreditCard, CheckCircle, X, AlertCircle } from "lucide-react";
import Layout from "../../components/layout/Layout";
import { pharmacyAPI } from "../../api/services";
import { toast } from "react-toastify";

const S_BG    = { pending:"#FEF9C3", processing:"#DBEAFE", shipped:"#FDF4FF", delivered:"#DCFCE7", cancelled:"#FEE2E2" };
const S_COLOR = { pending:"#CA8A04", processing:"#2563EB", shipped:"#7C3AED", delivered:"#16A34A",  cancelled:"#DC2626" };

function OrderSkeleton() {
  return (
    <div style={{background:"white",borderRadius:12,border:"1px solid var(--gray-200)",padding:20,boxShadow:"var(--shadow-sm)"}}>
      {[80,60,40].map((w,i) => (
        <div key={i} style={{height:14,borderRadius:8,marginBottom:10,width:`${w}%`,
          background:"linear-gradient(90deg,var(--gray-100) 25%,var(--gray-200) 50%,var(--gray-100) 75%)",
          backgroundSize:"400px 100%",animation:"shimmer 1.4s infinite"}}/>
      ))}
    </div>
  );
}

// Reusable lightweight modal — duplicated locally to avoid coupling to MyAppointments.
function Modal({ title, children, onClose }) {
  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, background:"rgba(15,23,42,.55)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:1000, padding:16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:"white", borderRadius:14, width:"100%", maxWidth:480,
        boxShadow:"0 20px 60px rgba(0,0,0,.2)", overflow:"hidden",
      }}>
        <div style={{
          display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"16px 20px", borderBottom:"1px solid var(--gray-200)",
        }}>
          <p style={{fontSize:15, fontWeight:800, color:"var(--gray-800)"}}>{title}</p>
          <button onClick={onClose} style={{
            background:"none", border:"none", cursor:"pointer",
            color:"var(--gray-400)", padding:4, display:"flex",
          }}><X size={18}/></button>
        </div>
        <div style={{padding:20}}>{children}</div>
      </div>
    </div>
  );
}

export default function MyOrders() {
  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [expanded,    setExpanded]    = useState(null);
  const [cancelModal, setCancelModal] = useState(null); // order or null
  const [cancelReason, setCancelReason] = useState("");
  const [submitting,  setSubmitting]  = useState(false);

  const loadOrders = () => {
    setLoading(true);
    pharmacyAPI.myOrders()
      .then(r => setOrders(r.data.data.data || []))
      .catch(() => toast.error("Failed to load orders"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, []);

  const submitCancel = async () => {
    if (!cancelModal) return;
    setSubmitting(true);
    try {
      await pharmacyAPI.cancelOrder(cancelModal.id, { cancellation_reason: cancelReason });
      // Update locally so UI reflects new status without a full refetch.
      setOrders(p => p.map(o => o.id === cancelModal.id ? { ...o, status:"cancelled" } : o));
      toast.success("Order cancelled");
      setCancelModal(null);
      setCancelReason("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not cancel order");
    } finally { setSubmitting(false); }
  };

  return (
    <Layout>
      <div className="pd-container pd-section">

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:12}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:800,color:"var(--gray-800)",marginBottom:4}}>My Orders</h1>
            <p style={{fontSize:13,color:"var(--gray-400)"}}>Track your pharmacy orders and delivery status</p>
          </div>
          <Link to="/pharmacy" className="btn-primary-pd">
            <ShoppingBag size={15}/> Shop Medicines
          </Link>
        </div>

        {loading ? (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {[1,2,3].map(i => <OrderSkeleton key={i}/>)}
          </div>
        ) : orders.length === 0 ? (
          <div className="pd-empty">
            <Package size={44}/>
            <p style={{marginTop:12}}>No orders placed yet</p>
            <Link to="/pharmacy" className="btn-primary-pd" style={{marginTop:16}}>
              Browse Medicines
            </Link>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {orders.map(order => {
              const open = expanded === order.id;
              const bg   = S_BG[order.status]    || "#F3F4F6";
              const col  = S_COLOR[order.status] || "#6B7280";
              const canCancel = order.status === "pending";
              return (
                <div key={order.id} style={{background:"white",borderRadius:12,border:"1px solid var(--gray-200)",overflow:"hidden",boxShadow:"var(--shadow-sm)"}}>

                  {/* Header row */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",cursor:"pointer",flexWrap:"wrap",gap:10}}
                    onClick={() => setExpanded(open ? null : order.id)}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                        <p style={{fontWeight:700,fontSize:15}}>Order #{order.id}</p>
                        <span style={{background:bg,color:col,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:99,textTransform:"capitalize"}}>
                          {order.status}
                        </span>
                      </div>
                      <p style={{fontSize:12,color:"var(--gray-400)"}}>
                        {new Date(order.created_at).toLocaleDateString("en-PK",{day:"numeric",month:"long",year:"numeric"})}
                        {" · "}{order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:14}}>
                      <p style={{fontSize:18,fontWeight:800,color:"var(--primary)"}}>
                        Rs. {Number(order.total_amount).toLocaleString()}
                      </p>
                      {open ? <ChevronUp size={18} color="var(--gray-400)"/> : <ChevronDown size={18} color="var(--gray-400)"/>}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {open && (
                    <div style={{borderTop:"1px solid var(--gray-200)",padding:"16px 20px",background:"var(--gray-50)"}}>

                      {/* Items */}
                      <p style={{fontSize:12,fontWeight:700,color:"var(--gray-600)",textTransform:"uppercase",letterSpacing:.5,marginBottom:10}}>
                        Order Items
                      </p>
                      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                        {order.items?.map(item => (
                          <div key={item.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"white",padding:"10px 14px",borderRadius:8,border:"1px solid var(--gray-200)",flexWrap:"wrap",gap:8}}>
                            <div>
                              <p style={{fontWeight:700,fontSize:13}}>{item.medicine?.name || "Medicine"}</p>
                              <p style={{fontSize:12,color:"var(--gray-400)"}}>Qty: {item.quantity} × Rs. {Number(item.unit_price).toLocaleString()}</p>
                            </div>
                            <p style={{fontWeight:800,fontSize:14,color:"var(--primary)"}}>
                              Rs. {Number(item.subtotal || item.unit_price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Delivery info */}
                      <div style={{display:"flex",gap:16,flexWrap:"wrap",fontSize:13,color:"var(--gray-600)",background:"white",padding:"12px 16px",borderRadius:8,border:"1px solid var(--gray-200)"}}>
                        {order.address && (
                          <span style={{display:"flex",alignItems:"center",gap:5}}>
                            <MapPin size={13} color="var(--primary)"/>
                            {order.address}{order.city ? `, ${order.city}` : ""}
                          </span>
                        )}
                        {order.phone && (
                          <span style={{display:"flex",alignItems:"center",gap:5}}>
                            <Phone size={13} color="var(--primary)"/> {order.phone}
                          </span>
                        )}
                        {order.payment_method && (
                          <span style={{display:"flex",alignItems:"center",gap:5}}>
                            <CreditCard size={13} color="var(--primary)"/> {order.payment_method.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}
                          </span>
                        )}
                      </div>

                      {order.status === "delivered" && (
                        <p style={{fontSize:13,color:"#16A34A",fontWeight:700,marginTop:10,display:"flex",alignItems:"center",gap:5}}>
                          <CheckCircle size={14}/> Delivered successfully
                        </p>
                      )}

                      {/* Cancel button — only for pending orders */}
                      {canCancel && (
                        <div style={{marginTop:14, display:"flex", justifyContent:"flex-end"}}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setCancelModal(order); }}
                            style={{
                              background:"#FEE2E2", color:"#DC2626",
                              border:"none", padding:"8px 14px", borderRadius:8,
                              fontSize:12, fontWeight:700, cursor:"pointer",
                              display:"flex", alignItems:"center", gap:5,
                            }}>
                            <AlertCircle size={13}/> Cancel Order
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel modal */}
      {cancelModal && (
        <Modal title="Cancel Order"
          onClose={() => !submitting && setCancelModal(null)}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <p style={{fontSize:13, color:"var(--gray-600)"}}>
              Cancel order <b>#{cancelModal.id}</b>? Stock will be restored and we'll notify our team.
            </p>
            <div>
              <label style={{fontSize:12, fontWeight:700, color:"var(--gray-700)", marginBottom:6, display:"block"}}>
                Reason (optional)
              </label>
              <textarea rows={3}
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Why are you cancelling? Helps us improve."
                maxLength={500}
                style={{
                  width:"100%", padding:"10px 12px", fontSize:13,
                  border:"1px solid var(--gray-200)", borderRadius:8,
                  resize:"vertical", fontFamily:"inherit", outline:"none",
                }}/>
            </div>
            <div style={{display:"flex", justifyContent:"flex-end", gap:8}}>
              <button onClick={() => setCancelModal(null)} disabled={submitting}
                style={{
                  background:"var(--gray-100)", color:"var(--gray-700)",
                  border:"none", padding:"8px 14px", borderRadius:8,
                  fontSize:12, fontWeight:700, cursor:"pointer",
                }}>
                Keep Order
              </button>
              <button onClick={submitCancel} disabled={submitting}
                style={{
                  background:"#DC2626", color:"white",
                  border:"none", padding:"8px 14px", borderRadius:8,
                  fontSize:12, fontWeight:700, cursor:"pointer",
                }}>
                {submitting ? "Cancelling..." : "Cancel Order"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
