import { useState, useEffect } from 'react';
import { Search, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminAPI } from '../../api/services';
import { toast } from 'react-toastify';

const ROLE_STYLE = {
  admin:   { bg:'#FEE2E2', color:'#DC2626' },
  doctor:  { bg:'#DCFCE7', color:'#16A34A' },
  patient: { bg:'#DBEAFE', color:'#2563EB' },
};

export default function ManageUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [role,    setRole]    = useState('');
  const [acting,  setActing]  = useState(null);

  const load = () => {
    setLoading(true);
    adminAPI.getUsers({ role: role || undefined, search: search || undefined })
      .then(r => setUsers(r.data.data.data || []))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [role]);

  const toggle = async (id) => {
    setActing(id);
    try {
      const res = await adminAPI.toggleUserStatus(id);
      const updated = res.data.data;
      setUsers(p => p.map(u => u.id === id ? { ...u, is_active: updated.is_active } : u));
      toast.success(updated.is_active ? 'User activated' : 'User suspended');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActing(null); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    setActing(id);
    try {
      await adminAPI.deleteUser(id);
      setUsers(p => p.filter(u => u.id !== id));
      toast.success('User deleted');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActing(null); }
  };

  const filtered = users.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div style={{maxWidth:1000}}>
        <div style={{marginBottom:20}}>
          <h1 style={{fontSize:22,fontWeight:800,color:'var(--gray-800)',marginBottom:4}}>Manage Users</h1>
          <p style={{fontSize:13,color:'var(--gray-400)'}}>View, suspend, or delete platform users</p>
        </div>

        {/* Controls */}
        <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'8px 14px',flex:1,minWidth:200,background:'white'}}>
            <Search size={15} color="var(--gray-400)"/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&load()}
              placeholder="Search name or email..."
              style={{border:'none',outline:'none',fontSize:13,width:'100%',fontFamily:'inherit'}}/>
          </div>
          {['','admin','doctor','patient'].map(r => (
            <button key={r} onClick={()=>setRole(r)}
              style={{padding:'8px 16px',borderRadius:99,border:'1.5px solid',fontSize:13,fontWeight:600,cursor:'pointer',
                borderColor:role===r?'var(--primary)':'var(--gray-200)',
                background:role===r?'var(--primary)':'white',
                color:role===r?'white':'var(--gray-600)'}}>
              {r ? r.charAt(0).toUpperCase()+r.slice(1) : 'All Roles'}
            </button>
          ))}
        </div>

        {loading ? <div className="pd-spinner"/> : (
          <div style={{background:'white',borderRadius:12,border:'1px solid var(--gray-200)',overflow:'hidden',boxShadow:'var(--shadow-sm)'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{borderBottom:'1px solid var(--gray-200)',background:'var(--gray-50)'}}>
                  <th style={{textAlign:'left',padding:'10px 16px',fontWeight:700,fontSize:11,color:'var(--gray-400)',textTransform:'uppercase',letterSpacing:.5}}>User</th>
                  <th style={{textAlign:'left',padding:'10px 16px',fontWeight:700,fontSize:11,color:'var(--gray-400)',textTransform:'uppercase',letterSpacing:.5}}>Role</th>
                  <th style={{textAlign:'left',padding:'10px 16px',fontWeight:700,fontSize:11,color:'var(--gray-400)',textTransform:'uppercase',letterSpacing:.5}}>Status</th>
                  <th style={{textAlign:'left',padding:'10px 16px',fontWeight:700,fontSize:11,color:'var(--gray-400)',textTransform:'uppercase',letterSpacing:.5}}>Joined</th>
                  <th style={{textAlign:'right',padding:'10px 16px',fontWeight:700,fontSize:11,color:'var(--gray-400)',textTransform:'uppercase',letterSpacing:.5}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={5} style={{textAlign:'center',padding:32,color:'var(--gray-400)'}}>No users found</td></tr>
                )}
                {filtered.map(u => {
                  const rs = ROLE_STYLE[u.role] || ROLE_STYLE.patient;
                  return (
                    <tr key={u.id} style={{borderBottom:'1px solid var(--gray-100)'}}>
                      <td style={{padding:'12px 16px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{width:36,height:36,borderRadius:'50%',background:'var(--primary-light)',color:'var(--primary)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,flexShrink:0}}>
                            {u.name?.[0]}
                          </div>
                          <div>
                            <p style={{fontWeight:700,color:'var(--gray-800)'}}>{u.name}</p>
                            <p style={{fontSize:12,color:'var(--gray-400)'}}>{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{padding:'12px 16px'}}>
                        <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:99,background:rs.bg,color:rs.color}}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{padding:'12px 16px'}}>
                        <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:99,
                          background:u.is_active?'#DCFCE7':'#FEE2E2',
                          color:u.is_active?'#16A34A':'#DC2626'}}>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td style={{padding:'12px 16px',color:'var(--gray-400)',fontSize:12}}>
                        {new Date(u.created_at).toLocaleDateString('en-PK')}
                      </td>
                      <td style={{padding:'12px 16px',textAlign:'right'}}>
                        {u.role !== 'admin' && (
                          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                            <button onClick={()=>toggle(u.id)} disabled={acting===u.id}
                              title={u.is_active?'Suspend':'Activate'}
                              style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,border:'1.5px solid var(--gray-200)',background:'white',color:'var(--gray-700)',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                              {u.is_active ? <ToggleRight size={15} color="#16A34A"/> : <ToggleLeft size={15} color="#DC2626"/>}
                              {acting===u.id ? '...' : u.is_active ? 'Suspend' : 'Activate'}
                            </button>
                            <button onClick={()=>deleteUser(u.id)} disabled={acting===u.id}
                              style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,border:'none',background:'#FEE2E2',color:'#DC2626',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                              <Trash2 size={13}/> {acting===u.id ? '...' : 'Delete'}
                            </button>
                          </div>
                        )}
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
