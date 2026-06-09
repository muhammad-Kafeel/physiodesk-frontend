import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminAPI } from '../../api/services';
import { toast } from 'react-toastify';

const S_STYLE = {
  completed: { bg:'#DCFCE7', color:'#16A34A' },
  pending:   { bg:'#FEF9C3', color:'#CA8A04' },
  failed:    { bg:'#FEE2E2', color:'#DC2626' },
  refunded:  { bg:'#FDF4FF', color:'#7C3AED' },
};

export default function Transactions() {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [total,    setTotal]    = useState(0);

  useEffect(() => {
    adminAPI.getTransactions()
      .then(r => {
        const list = r.data.data.data || [];
        setPayments(list);
        setTotal(list.filter(p=>p.status==='completed').reduce((s,p)=>s+Number(p.amount),0));
      })
      .catch(() => toast.error('Failed to load transactions'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div style={{maxWidth:1000}}>
        <div style={{marginBottom:20}}>
          <h1 style={{fontSize:22,fontWeight:800,color:'var(--gray-800)',marginBottom:4}}>Transactions</h1>
          <p style={{fontSize:13,color:'var(--gray-400)'}}>All payment records across appointments and orders</p>
        </div>

        {/* Summary */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:20}}>
          {[
            { label:'Total Transactions', value: payments.length,                       bg:'#EFF6FF', color:'var(--primary)' },
            { label:'Completed',          value: payments.filter(p=>p.status==='completed').length, bg:'#DCFCE7', color:'#16A34A' },
            { label:'Total Revenue',      value: `Rs. ${total.toLocaleString()}`,       bg:'#F0FDF4', color:'#16A34A' },
          ].map((s,i) => (
            <div key={i} style={{background:'white',border:'1px solid var(--gray-200)',borderRadius:12,padding:16,boxShadow:'var(--shadow-sm)'}}>
              <p style={{fontSize:20,fontWeight:800,color:s.color,marginBottom:4}}>{s.value}</p>
              <p style={{fontSize:12,color:'var(--gray-400)'}}>{s.label}</p>
            </div>
          ))}
        </div>

        {loading ? <div className="pd-spinner"/> : (
          <div style={{background:'white',borderRadius:12,border:'1px solid var(--gray-200)',overflow:'auto',boxShadow:'var(--shadow-sm)'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:'var(--gray-50)',borderBottom:'1px solid var(--gray-200)'}}>
                  {['#','Patient','Amount','Method','Type','Status','Date'].map(h => (
                    <th key={h} style={{textAlign:'left',padding:'10px 14px',fontWeight:700,fontSize:11,color:'var(--gray-400)',textTransform:'uppercase',letterSpacing:.5,whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 && (
                  <tr><td colSpan={7} style={{textAlign:'center',padding:32,color:'var(--gray-400)'}}>No transactions yet</td></tr>
                )}
                {payments.map(p => {
                  const s = S_STYLE[p.status] || S_STYLE.pending;
                  return (
                    <tr key={p.id} style={{borderBottom:'1px solid var(--gray-100)'}}>
                      <td style={{padding:'10px 14px',color:'var(--gray-400)',fontFamily:'monospace'}}>{p.id}</td>
                      <td style={{padding:'10px 14px',fontWeight:600}}>{p.patient?.user?.name || '—'}</td>
                      <td style={{padding:'10px 14px',fontWeight:800,color:'var(--teal)'}}>
                        Rs. {Number(p.amount).toLocaleString()}
                      </td>
                      <td style={{padding:'10px 14px',textTransform:'capitalize',color:'var(--gray-600)'}}>{p.method}</td>
                      <td style={{padding:'10px 14px'}}>
                        <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:99,
                          background:p.payable_type?.includes('Appointment')?'#DBEAFE':'#FDF4FF',
                          color:p.payable_type?.includes('Appointment')?'#2563EB':'#7C3AED'}}>
                          {p.payable_type?.includes('Appointment') ? 'Appointment' : 'Order'}
                        </span>
                      </td>
                      <td style={{padding:'10px 14px'}}>
                        <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:99,background:s.bg,color:s.color}}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{padding:'10px 14px',fontSize:12,color:'var(--gray-400)'}}>
                        {new Date(p.created_at).toLocaleDateString('en-PK',{day:'numeric',month:'short',year:'numeric'})}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
