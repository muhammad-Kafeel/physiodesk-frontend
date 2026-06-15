import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Package, MapPin, Phone, ChevronDown, ChevronUp, CreditCard, CheckCircle } from "lucide-react";
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

export default function MyOrders() {
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    pharmacyAPI.myOrders()
      .then(r => setOrders(r.data.data.data || []))
      .catch(() => toast.error("Failed to load orders"))
      .finally(() => setLoading(false));
  }, []);

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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
