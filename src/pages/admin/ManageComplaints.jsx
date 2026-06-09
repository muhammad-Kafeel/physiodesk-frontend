import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminAPI } from '../../api/services';
import { toast } from 'react-toastify';

const STATUS_OPTS = ['','pending','under_review','resolved','dismissed'];
const PRIORITY_COLOR = { low:'#16A34A', medium:'#CA8A04', high:'#EA580C', urgent:'#DC2626' };
const S_BG = { pending:'#FEF9C3', under_review:'#DBEAFE', resolved:'#DCFCE7', dismissed:'#FEE2E2' };
const S_C  = { pending:'#CA8A04', under_review:'#2563EB', resolved:'#16A34A', dismissed:'#DC2626' };

export default function ManageComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('');
  const [modal,      setModal]      = useState(null);
  const [note,       setNote]       = useState('');
  const [resolution, setResolution] = useState('resolved');
  const [acting,     setActing]     = useState(false);

  useEffect(() => {
    setLoading(true);
    adminAPI.getComplaints({ status: filter || undefined })
      .then(r => setComplaints(r.data.data.data || []))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [filter]);

  const resolve = async () => {
    if (!note.trim()) { toast.error('Please enter an admin note'); return; }
    setActing(true);
    try {
      await adminAPI.resolveComplaint(modal.id, { admin_note: note, status: resolution });
      setComplaints(p => p.map(c =>
        c.id === modal.id ? { ...c, status: resolution, admin_note: note } : c
      ));
      toast.success('Complaint resolved');
      setModal(null); setNote('');
    } catch { toast.error('Failed to resolve'); }
    finally { setActing(false); }
  };

  return (
    <DashboardLayout>
      <div style={{maxWidth:900}}>
        <div style={{marginBottom:20}}>
          <h1 style={{fontSize:22,fontWeight:800,color:'var(--gray-800)',marginBottom:4}}>Manage Complaints</h1>
          <p style={{fontSize:13,color:'var(--gray-400)'}}>Review and resolve user complaints</p>
        </div>

        {/* Filter tabs */}
        <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
          {STATUS_OPTS.map(s => (
            <button key={s} onClick={()=>setFilter(s)}
              style={{padding:'7px 16px',borderRadius:99,border:'1.5px solid',fontSize:13,fontWeight:600,cursor:'pointer',
                borderColor:filter===s?'var(--primary)':'var(--gray-200)',
                background:filter===s?'var(--primary)':'white',
                color:filter===s?'white':'var(--gray-600)'}}>
              {s ? s.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) : 'All'}
            </button>
          ))}
        </div>

        {loading ? <div className="pd-spinner"/> : (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {complaints.length === 0 && <div className="pd-empty"><p>No complaints found</p></div>}
            {complaints.map(c => (
              <div key={c.id} style={{background:'white',border:'1px solid var(--gray-200)',borderRadius:12,padding:18,boxShadow:'var(--shadow-sm)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:10,marginBottom:10}}>
                  <div>
                    <p style={{fontWeight:700,fontSize:15,marginBottom:4}}>{c.subject}</p>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:99,background:'var(--gray-100)',color:PRIORITY_COLOR[c.priority]||'#6B7280'}}>
                        {c.priority} priority
                      </span>
                      <span style={{fontSize:12,color:'var(--gray-400)'}}>by {c.filed_by?.name || '—'}</span>
                      <span style={{fontSize:12,color:'var(--gray-400)'}}>{new Date(c.created_at).toLocaleDateString('en-PK')}</span>
                    </div>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,padding:'4px 12px',borderRadius:99,background:S_BG[c.status]||'#F3F4F6',color:S_C[c.status]||'#6B7280'}}>
                    {c.status?.replace(/_/g,' ')}
                  </span>
                </div>
                <p style={{fontSize:13,color:'var(--gray-600)',lineHeight:1.6,marginBottom:10}}>{c.description}</p>
                {c.admin_note && (
                  <div style={{background:'#F0FDF4',border:'1px solid #BBF7D0',borderRadius:8,padding:'10px 14px',marginBottom:10}}>
                    <p style={{fontSize:11,fontWeight:700,color:'#16A34A',marginBottom:3}}>ADMIN NOTE</p>
                    <p style={{fontSize:13}}>{c.admin_note}</p>
                  </div>
                )}
                {!['resolved','dismissed'].includes(c.status) && (
                  <button onClick={()=>{setModal(c);setNote('');setResolution('resolved');}}
                    style={{padding:'7px 16px',background:'var(--primary)',color:'white',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                    Resolve / Dismiss
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {modal && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
            <div style={{background:'white',borderRadius:16,padding:28,maxWidth:480,width:'100%'}}>
              <h3 style={{fontWeight:800,fontSize:16,marginBottom:6}}>Resolve Complaint</h3>
              <p style={{fontSize:13,color:'var(--gray-600)',marginBottom:16}}><strong>{modal.subject}</strong></p>
              <div style={{marginBottom:12}}>
                <label style={{fontSize:12,fontWeight:700,color:'var(--gray-600)',display:'block',marginBottom:6}}>Resolution</label>
                <select value={resolution} onChange={e=>setResolution(e.target.value)}
                  style={{border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'9px 14px',fontSize:13,width:'100%',outline:'none'}}>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
              <div style={{marginBottom:16}}>
                <label style={{fontSize:12,fontWeight:700,color:'var(--gray-600)',display:'block',marginBottom:6}}>Admin Note *</label>
                <textarea value={note} onChange={e=>setNote(e.target.value)}
                  rows={4} placeholder="Explain the resolution..."
                  style={{width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'10px 14px',fontSize:13,fontFamily:'inherit',outline:'none',resize:'vertical'}}/>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button onClick={()=>setModal(null)} className="btn-outline-pd">Cancel</button>
                <button onClick={resolve} disabled={acting} className="btn-primary-pd">
                  {acting ? '...' : 'Submit Resolution'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
