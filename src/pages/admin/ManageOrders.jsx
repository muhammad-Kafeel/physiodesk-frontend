import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminAPI } from '../../api/services';
import { toast } from 'react-toastify';

const STATUS_OPTS = ['pending','processing','shipped','delivered','cancelled'];
const S_STYLE = {
  pending:    { bg:'#FEF9C3', color:'#CA8A04' },
  processing: { bg:'#DBEAFE', color:'#2563EB' },
  shipped:    { bg:'#FDF4FF', color:'#7C3AED' },
  delivered:  { bg:'#DCFCE7', color:'#16A34A' },
  cancelled:  { bg:'#FEE2E2', color:'#DC2626' },
};

export default function ManageOrders() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating,setUpdating]= useState(null);
  const [expanded,setExpanded]= useState(null);

  useEffect(() => {
    adminAPI.getOrders()
      .then(r => setOrders(r.data.data.data || []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await adminAPI.updateOrderStatus(id, { status });
      setOrders(p => p.map(o => o.id === id ? { ...o, status } : o));
      toast.success('Order status updated');
    } catch { toast.error('Failed to update'); }
    finally { setUpdating(null); }
  };

  return (
    <DashboardLayout>
      <div style={{maxWidth:1000}}>
        <div style={{marginBottom:20}}>
          <h1 style={{fontSize:22,fontWeight:800,color:'var(--gray-800)',marginBottom:4}}>Manage Orders</h1>
          <p style={{fontSize:13,color:'var(--gray-400)'}}>View all pharmacy orders and update delivery status</p>
        </div>

        {loading ? <div className="pd-spinner"/> : (
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {orders.length === 0 && <div className="pd-empty"><p>No orders yet</p></div>}
            {orders.map(o => {
              const s = S_STYLE[o.status] || S_STYLE.pending;
              const open = expanded === o.id;
              return (
                <div key={o.id} style={{background:'white',border:'1px solid var(--gray-200)',borderRadius:12,overflow:'hidden',boxShadow:'var(--shadow-sm)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:14,padding:16,cursor:'pointer',flexWrap:'wrap'}}
                    onClick={()=>setExpanded(open?null:o.id)}>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontWeight:700,fontSize:14,marginBottom:2}}>Order #{o.id}</p>
                      <p style={{fontSize:13,color:'var(--gray-600)'}}>
                        {o.patient?.user?.name || '—'} · {o.city}
                      </p>
                      <p style={{fontSize:12,color:'var(--gray-400)',marginTop:2}}>
                        {new Date(o.created_at).toLocaleDateString('en-PK')} · {o.items?.length || 0} items
                      </p>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <p style={{fontWeight:800,fontSize:15,color:'var(--teal)',marginBottom:4}}>
                        Rs. {Number(o.total_amount).toLocaleString()}
                      </p>
                      <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:99,background:s.bg,color:s.color}}>
                        {o.status}
                      </span>
                    </div>
                    <div style={{display:'flex',gap:6}} onClick={e=>e.stopPropagation()}>
                      <select value={o.status}
                        onChange={e=>updateStatus(o.id,e.target.value)}
                        disabled={updating===o.id}
                        style={{border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'7px 12px',fontSize:12,fontWeight:600,cursor:'pointer',outline:'none'}}>
                        {STATUS_OPTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                  {open && (
                    <div style={{borderTop:'1px solid var(--gray-200)',padding:16,background:'var(--gray-50)'}}>
                      <p style={{fontWeight:700,fontSize:13,marginBottom:10}}>Order Items</p>
                      <div style={{display:'flex',flexDirection:'column',gap:6}}>
                        {(o.items || []).map(item => (
                          <div key={item.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'white',padding:'8px 14px',borderRadius:8,border:'1px solid var(--gray-200)'}}>
                            <span style={{fontSize:13,fontWeight:600}}>{item.medicine?.name || '—'}</span>
                            <span style={{fontSize:13,color:'var(--gray-400)'}}>x{item.quantity}</span>
                            <span style={{fontSize:13,fontWeight:700}}>Rs. {Number(item.subtotal||item.unit_price*item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{marginTop:12,display:'flex',gap:16,flexWrap:'wrap',fontSize:13,color:'var(--gray-600)'}}>
                        <span>📍 {o.address}, {o.city}</span>
                        <span>📞 {o.phone}</span>
                        <span>💳 {o.payment_method || '—'}</span>
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
