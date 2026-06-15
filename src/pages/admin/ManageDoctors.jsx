import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Search, Clock, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminAPI } from '../../api/services';
import { toast } from 'react-toastify';

export default function ManageDoctors() {
  const [doctors,  setDoctors]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all'); // all | pending | verified
  const [modal,    setModal]    = useState(null);  // { type:'view'|'reject', doctor }
  const [reason,   setReason]   = useState('');
  const [acting,   setActing]   = useState(null);

  useEffect(() => {
    adminAPI.getUsers({ role:'doctor' })
      .then(r => setDoctors(r.data.data.data || []))
      .catch(() => toast.error('Failed to load doctors'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = doctors.filter(u => {
    const d   = u.doctor;
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      d?.specialization?.toLowerCase().includes(search.toLowerCase()) ||
      d?.pmdc_number?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all'     ? true :
      filter === 'pending' ? (d && !d.is_verified) :
      filter === 'verified'? (d && d.is_verified) : true;
    return matchSearch && matchFilter;
  });

  const verifyDoctor = async (doctorId) => {
    setActing(doctorId);
    try {
      await adminAPI.verifyDoctor(doctorId);
      setDoctors(prev => prev.map(u =>
        u.doctor?.id === doctorId
          ? { ...u, doctor: { ...u.doctor, is_verified: true } }
          : u
      ));
      toast.success('Doctor verified!');
    } catch { toast.error('Failed to verify'); }
    finally { setActing(null); }
  };

  const rejectDoctor = async () => {
    if (!reason.trim()) { toast.error('Please enter a reason'); return; }
    const doctorId = modal.doctor.doctor?.id;
    setActing(doctorId);
    try {
      await adminAPI.rejectDoctor(doctorId, { reason });
      setDoctors(prev => prev.map(u =>
        u.doctor?.id === doctorId
          ? { ...u, doctor: { ...u.doctor, is_verified: false, rejected_reason: reason } }
          : u
      ));
      toast.success('Doctor rejected.');
      setModal(null); setReason('');
    } catch { toast.error('Failed to reject'); }
    finally { setActing(null); }
  };

  const d = modal?.doctor;

  return (
    <DashboardLayout>
      <div style={{maxWidth:1000}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,flexWrap:'wrap',gap:12}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:800,color:'var(--gray-800)',marginBottom:4}}>Manage Doctors</h1>
            <p style={{fontSize:13,color:'var(--gray-400)'}}>Verify doctor profiles and manage their access</p>
          </div>
        </div>

        {/* Controls */}
        <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'8px 14px',flex:1,minWidth:200,background:'white'}}>
            <Search size={15} color="var(--gray-400)"/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search by name, email, PMDC..."
              style={{border:'none',outline:'none',fontSize:13,width:'100%',fontFamily:'inherit'}}/>
          </div>
          {['all','pending','verified'].map(f => (
            <button key={f} onClick={()=>setFilter(f)}
              style={{padding:'8px 16px',borderRadius:99,border:'1.5px solid',fontSize:13,fontWeight:600,cursor:'pointer',
                borderColor:filter===f?'var(--primary)':'var(--gray-200)',
                background:filter===f?'var(--primary)':'white',
                color:filter===f?'white':'var(--gray-600)'}}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? <div className="pd-spinner"/> : (
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {filtered.length === 0 && <div className="pd-empty"><p>No doctors found</p></div>}
            {filtered.map(u => {
              const doc = u.doctor;
              const verified = doc?.is_verified;
              return (
                <div key={u.id} style={{background:'white',border:'1px solid var(--gray-200)',borderRadius:12,padding:18,display:'flex',alignItems:'center',gap:14,flexWrap:'wrap',boxShadow:'var(--shadow-sm)'}}>
                  <div style={{width:44,height:44,borderRadius:'50%',background:verified?'#DCFCE7':'#FEF9C3',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:verified?'#16A34A':'#CA8A04',flexShrink:0}}>
                    {u.name?.[0]}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontWeight:700,fontSize:14,marginBottom:2}}>Dr. {u.name}</p>
                    <p style={{fontSize:12,color:'var(--gray-400)',marginBottom:4}}>{u.email}</p>
                    {doc ? (
                      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                        <span style={{fontSize:11,background:'var(--primary-light)',color:'var(--primary)',padding:'2px 8px',borderRadius:99,fontWeight:700}}>{doc.specialization}</span>
                        <span style={{fontSize:11,color:'var(--gray-400)'}}>PMDC: {doc.pmdc_number}</span>
                        <span style={{fontSize:11,color:'var(--gray-400)'}}>{doc.experience_years}y exp</span>
                        <span style={{fontSize:11,color:'var(--gray-400)'}}>Rs. {Number(doc.consultation_fee).toLocaleString()}</span>
                      </div>
                    ) : <span style={{fontSize:12,color:'#DC2626'}}>No doctor profile yet</span>}
                    {doc?.rejected_reason && (
                      <p style={{fontSize:11,color:'#DC2626',marginTop:4,display:'flex',alignItems:'center',gap:4}}>
                        <XCircle size={11}/> Rejected: {doc.rejected_reason}
                      </p>
                    )}
                  </div>
                  <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:99,
                    display:'inline-flex',alignItems:'center',gap:4,
                    background:verified?'#DCFCE7':'#FEF9C3',color:verified?'#16A34A':'#CA8A04'}}>
                    {verified ? <><CheckCircle size={11}/> Verified</> : <><Clock size={11}/> Pending</>}
                  </span>
                  <div style={{display:'flex',gap:8}}>
                    {doc && (
                      <button onClick={()=>setModal({type:'view',doctor:u})}
                        style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:8,border:'1.5px solid var(--gray-200)',background:'white',color:'var(--gray-700)',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                        <Eye size={14}/> View
                      </button>
                    )}
                    {doc && !verified && (
                      <button onClick={()=>verifyDoctor(doc.id)} disabled={acting===doc.id}
                        style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:8,border:'none',background:'#16A34A',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                        <CheckCircle size={14}/> {acting===doc.id?'...':'Verify'}
                      </button>
                    )}
                    {doc && (
                      <button onClick={()=>{setModal({type:'reject',doctor:u});setReason('');}}
                        style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:8,border:'none',background:'#DC2626',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                        <XCircle size={14}/> Reject
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modals */}
        {modal && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
            <div style={{background:'white',borderRadius:16,padding:28,maxWidth:520,width:'100%',maxHeight:'90vh',overflowY:'auto'}}>

              {/* View modal */}
              {modal.type === 'view' && (
                <>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                    <h3 style={{fontWeight:800,fontSize:17}}>Doctor Profile</h3>
                    <button onClick={()=>setModal(null)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'var(--gray-400)',display:'flex',alignItems:'center'}}><XCircle size={20}/></button>
                  </div>
                  {[
                    ['Name',            `Dr. ${d.name}`],
                    ['Email',           d.email],
                    ['Specialization',  d.doctor?.specialization],
                    ['PMDC Number',     d.doctor?.pmdc_number],
                    ['Qualification',   d.doctor?.qualification],
                    ['Experience',      `${d.doctor?.experience_years} years`],
                    ['Fee',             `Rs. ${Number(d.doctor?.consultation_fee).toLocaleString()}`],
                    ['City',            d.doctor?.city || '—'],
                    ['Phone',           d.doctor?.phone || '—'],
                    ['Gender',          d.doctor?.gender],
                  ].map(([k,v]) => (
                    <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--gray-100)',fontSize:13}}>
                      <span style={{color:'var(--gray-400)',fontWeight:600}}>{k}</span>
                      <span style={{fontWeight:700,textAlign:'right'}}>{v}</span>
                    </div>
                  ))}
                  {d.doctor?.bio && (
                    <div style={{marginTop:14,background:'var(--gray-50)',borderRadius:8,padding:12}}>
                      <p style={{fontSize:11,fontWeight:700,color:'var(--gray-400)',marginBottom:4}}>BIO</p>
                      <p style={{fontSize:13,lineHeight:1.6}}>{d.doctor.bio}</p>
                    </div>
                  )}
                  <button onClick={()=>setModal(null)} className="btn-primary-pd" style={{marginTop:20,width:'100%',justifyContent:'center'}}>Close</button>
                </>
              )}

              {/* Reject modal */}
              {modal.type === 'reject' && (
                <>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                    <h3 style={{fontWeight:800,fontSize:17,color:'#DC2626'}}>Reject Doctor</h3>
                    <button onClick={()=>setModal(null)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'var(--gray-400)',display:'flex',alignItems:'center'}}><XCircle size={20}/></button>
                  </div>
                  <p style={{fontSize:13,color:'var(--gray-600)',marginBottom:16}}>
                    Rejecting <strong>Dr. {d.name}</strong>. Please provide a reason:
                  </p>
                  <textarea value={reason} onChange={e=>setReason(e.target.value)}
                    rows={4} placeholder="e.g. PMDC number could not be verified..."
                    style={{width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'10px 14px',fontSize:13,fontFamily:'inherit',outline:'none',resize:'vertical',marginBottom:16}}/>
                  <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                    <button onClick={()=>setModal(null)} className="btn-outline-pd">Cancel</button>
                    <button onClick={rejectDoctor} disabled={acting}
                      style={{padding:'9px 20px',background:'#DC2626',color:'white',border:'none',borderRadius:8,fontWeight:700,cursor:'pointer',fontSize:13}}>
                      {acting?'...':'Confirm Reject'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
