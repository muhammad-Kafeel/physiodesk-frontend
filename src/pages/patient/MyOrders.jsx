import { useState, useEffect } from "react";
import Layout from "../../components/layout/Layout";
import { pharmacyAPI } from "../../api/services";
import { toast } from "react-toastify";

const STATUS_BG    = { pending:"#FEF9C3", processing:"#DBEAFE", dispatched:"#FEF9C3", delivered:"#DCFCE7", cancelled:"#FEE2E2" };
const STATUS_COLOR = { pending:"#CA8A04", processing:"#2563EB", dispatched:"#CA8A04", delivered:"#16A34A",  cancelled:"#DC2626" };

export default function MyOrders() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pharmacyAPI.myOrders()
      .then(r => setOrders(r.data.data.data || []))
      .catch(() => toast.error("Failed to load orders"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="pd-container pd-section">
        <h1 style={{fontSize:22, fontWeight:800, color:"var(--gray-800)", marginBottom:20}}>My Orders</h1>

        {loading ? <div className="pd-spinner" /> :
          orders.length === 0 ? (
            <div className="pd-empty">
              <p style={{fontSize:40}}>📦</p>
              <p>No orders placed yet</p>
            </div>
          ) : (
            <div style={{display:"flex", flexDirection:"column", gap:14}}>
              {orders.map(order => (
                <div key={order.id} style={{background:"white", borderRadius:12, border:"1px solid var(--gray-200)", padding:20}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, flexWrap:"wrap", gap:8}}>
                    <div>
                      <p style={{fontWeight:700, fontSize:15}}>{order.order_number}</p>
                      <p style={{fontSize:12, color:"var(--gray-400)"}}>
                        {new Date(order.created_at).toLocaleDateString("en-PK", {day:"numeric", month:"short", year:"numeric"})}
                      </p>
                    </div>
                    <span style={{background:STATUS_BG[order.status]||"#F3F4F6", color:STATUS_COLOR[order.status]||"#6B7280", fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:99, textTransform:"capitalize"}}>
                      {order.status}
                    </span>
                  </div>

                  <div style={{display:"flex", flexDirection:"column", gap:6, marginBottom:12, padding:12, background:"var(--gray-50)", borderRadius:8}}>
                    {order.items?.map(item => (
                      <div key={item.id} style={{display:"flex", justifyContent:"space-between", fontSize:13}}>
                        <span style={{color:"var(--gray-700)"}}>{item.medicine?.name} <span style={{color:"var(--gray-400)"}}>× {item.quantity}</span></span>
                        <span style={{fontWeight:700}}>Rs. {Number(item.subtotal).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:"1px solid var(--gray-200)", paddingTop:10, flexWrap:"wrap", gap:8}}>
                    <div>
                      <p style={{fontSize:12, color:"var(--gray-400)"}}>Delivery: {order.delivery_city}</p>
                      {order.delivered_at && <p style={{fontSize:12, color:"#16A34A", fontWeight:600}}>✓ Delivered {new Date(order.delivered_at).toLocaleDateString()}</p>}
                    </div>
                    <div style={{textAlign:"right"}}>
                      <p style={{fontSize:12, color:"var(--gray-400)"}}>Total</p>
                      <p style={{fontSize:18, fontWeight:800, color:"var(--primary)"}}>Rs. {Number(order.total_amount).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </Layout>
  );
}
