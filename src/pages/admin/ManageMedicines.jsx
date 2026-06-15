import { useState, useEffect } from 'react';
import { Plus, Edit2, Package } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminAPI } from '../../api/services';
import { toast } from 'react-toastify';

const EMPTY = { name:'', brand:'', category:'', description:'', price:'', quantity:'', unit:'', reorder_level:10, requires_prescription:false, expiry_date:'' };

export default function ManageMedicines() {
  const [meds,    setMeds]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // null | 'add' | { ...med }
  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);

  const load = () => {
    setLoading(true);
    adminAPI.getMedicines()
      .then(r => setMeds(r.data.data.data || []))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm(EMPTY); setModal('add'); };
  const openEdit = (m) => {
    setForm({ name:m.name||'', brand:m.brand||'', category:m.category||'', description:m.description||'',
      price:m.price||'', quantity:m.quantity||'', unit:m.unit||'',
      reorder_level:m.reorder_level||10, requires_prescription:m.requires_prescription||false,
      expiry_date:m.expiry_date||'' });
    setModal(m);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'add') {
        await adminAPI.createMedicine(form);
        toast.success('Medicine added!');
      } else {
        await adminAPI.updateMedicine(modal.id, form);
        toast.success('Medicine updated!');
      }
      setModal(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const f = (k, v) => setForm(p => ({...p, [k]: v}));

  return (
    <DashboardLayout>
      <div style={{maxWidth:1000}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,flexWrap:'wrap',gap:12}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:800,color:'var(--gray-800)',marginBottom:4}}>Manage Medicines</h1>
            <p style={{fontSize:13,color:'var(--gray-400)'}}>Add, edit, and manage pharmacy inventory</p>
          </div>
          <button className="btn-primary-pd" onClick={openAdd}><Plus size={15}/> Add Medicine</button>
        </div>

        {loading ? <div className="pd-spinner"/> : (
          <div style={{background:'white',borderRadius:12,border:'1px solid var(--gray-200)',overflowX:'auto',boxShadow:'var(--shadow-sm)',WebkitOverflowScrolling:'touch'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:640}}>
              <thead>
                <tr style={{background:'var(--gray-50)',borderBottom:'1px solid var(--gray-200)'}}>
                  {['Medicine','Category','Price','Stock','Rx Required','Expires','Actions'].map(h => (
                    <th key={h} style={{textAlign:'left',padding:'10px 14px',fontWeight:700,fontSize:11,color:'var(--gray-400)',textTransform:'uppercase',letterSpacing:.5,whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {meds.length === 0 && <tr><td colSpan={7} style={{textAlign:'center',padding:32,color:'var(--gray-400)'}}>No medicines</td></tr>}
                {meds.map(m => {
                  const lowStock = m.quantity <= (m.reorder_level || 10);
                  return (
                    <tr key={m.id} style={{borderBottom:'1px solid var(--gray-100)'}}>
                      <td style={{padding:'12px 14px'}}>
                        <p style={{fontWeight:700}}>{m.name}</p>
                        {m.brand && <p style={{fontSize:11,color:'var(--gray-400)'}}>{m.brand}</p>}
                      </td>
                      <td style={{padding:'12px 14px',color:'var(--gray-600)'}}>{m.category}</td>
                      <td style={{padding:'12px 14px',fontWeight:700}}>Rs. {Number(m.price).toLocaleString()}</td>
                      <td style={{padding:'12px 14px'}}>
                        <span style={{fontWeight:700,color:lowStock?'#DC2626':'#16A34A'}}>
                          {m.quantity} {m.unit}
                        </span>
                        {lowStock && <span style={{fontSize:10,background:'#FEE2E2',color:'#DC2626',padding:'1px 6px',borderRadius:99,marginLeft:6,fontWeight:700}}>LOW</span>}
                      </td>
                      <td style={{padding:'12px 14px'}}>
                        <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:99,
                          background:m.requires_prescription?'#FEF9C3':'#DCFCE7',
                          color:m.requires_prescription?'#CA8A04':'#16A34A'}}>
                          {m.requires_prescription ? 'Rx' : 'OTC'}
                        </span>
                      </td>
                      <td style={{padding:'12px 14px',fontSize:12,color:'var(--gray-400)'}}>{m.expiry_date || '—'}</td>
                      <td style={{padding:'12px 14px'}}>
                        <button onClick={()=>openEdit(m)}
                          style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,border:'1.5px solid var(--gray-200)',background:'white',color:'var(--gray-700)',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                          <Edit2 size={13}/> Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {modal !== null && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
            <div style={{background:'white',borderRadius:16,padding:28,maxWidth:560,width:'100%',maxHeight:'90vh',overflowY:'auto'}}>
              <h3 style={{fontWeight:800,fontSize:17,marginBottom:20}}>{modal==='add'?'Add Medicine':'Edit Medicine'}</h3>
              <form onSubmit={save}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
                  {[['name','Medicine Name *','text'],['brand','Brand','text'],['category','Category *','text'],['unit','Unit (e.g. tablet, ml)','text'],['price','Price (PKR) *','number'],['quantity','Stock Quantity *','number'],['reorder_level','Reorder Level','number'],['expiry_date','Expiry Date','date']].map(([k,ph,type]) => (
                    <div key={k}>
                      <label style={{fontSize:12,fontWeight:700,color:'var(--gray-600)',display:'block',marginBottom:5}}>{ph}</label>
                      <input type={type} value={form[k]} onChange={e=>f(k,e.target.value)}
                        required={ph.includes('*')}
                        style={{border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'9px 14px',fontSize:13,width:'100%',outline:'none',fontFamily:'inherit'}}/>
                    </div>
                  ))}
                </div>
                <div style={{marginBottom:14}}>
                  <label style={{fontSize:12,fontWeight:700,color:'var(--gray-600)',display:'block',marginBottom:5}}>Description</label>
                  <textarea value={form.description} onChange={e=>f('description',e.target.value)}
                    rows={3} style={{border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'9px 14px',fontSize:13,width:'100%',outline:'none',resize:'vertical',fontFamily:'inherit'}}/>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
                  <input type="checkbox" id="rx" checked={form.requires_prescription}
                    onChange={e=>f('requires_prescription',e.target.checked)}
                    style={{width:16,height:16,accentColor:'var(--primary)'}}/>
                  <label htmlFor="rx" style={{fontSize:13,fontWeight:600,cursor:'pointer'}}>Requires Prescription (Rx)</label>
                </div>
                <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                  <button type="button" onClick={()=>setModal(null)} className="btn-outline-pd">Cancel</button>
                  <button type="submit" className="btn-primary-pd" disabled={saving}>
                    {saving?<span className="auth-spinner"/>:<><Package size={14}/> {modal==='add'?'Add Medicine':'Save Changes'}</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
