import { useState, useEffect } from "react";
import { MessageSquare, Plus } from "lucide-react";
import Layout from "../../components/layout/Layout";
import { complaintAPI } from "../../api/services";
import { toast } from "react-toastify";

const S_BG    = { pending:"#FEF9C3", under_review:"#DBEAFE", resolved:"#DCFCE7", dismissed:"#FEE2E2" };
const S_COLOR = { pending:"#CA8A04", under_review:"#2563EB", resolved:"#16A34A", dismissed:"#DC2626" };
const PRIORITY_COLOR = { low:"#16A34A", medium:"#CA8A04", high:"#EA580C", urgent:"#DC2626" };

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject:"", description:"", priority:"medium" });

  useEffect(() => {
    complaintAPI.list()
      .then(r => setComplaints(r.data.data.data || []))
      .catch(() => toast.error("Failed to load complaints"))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await complaintAPI.store(form);
      setComplaints(p => [res.data.data, ...p]);
      setShowForm(false);
      setForm({ subject:"", description:"", priority:"medium" });
      toast.success("Complaint submitted successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="pd-container pd-section">
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:12}}>
          <h1 style={{fontSize:22, fontWeight:800, color:"var(--gray-800)"}}>My Complaints</h1>
          <button className="btn-primary-pd" onClick={() => setShowForm(p => !p)}>
            <Plus size={15} /> {showForm ? "Cancel" : "New Complaint"}
          </button>
        </div>

        {/* Complaint form */}
        {showForm && (
          <div style={{background:"white", borderRadius:12, border:"1px solid var(--gray-200)", padding:24, marginBottom:20}}>
            <h3 style={{fontSize:16, fontWeight:700, marginBottom:16}}>Submit a Complaint</h3>
            <form onSubmit={submit}>
              <div style={{marginBottom:14}}>
                <label style={{fontSize:12, fontWeight:700, color:"var(--gray-600)", display:"block", marginBottom:6}}>Subject *</label>
                <input value={form.subject} onChange={e => setForm(p => ({...p, subject:e.target.value}))}
                  placeholder="Brief description of your issue" required
                  style={{width:"100%", border:"1.5px solid var(--gray-200)", borderRadius:8, padding:"10px 14px", fontSize:13, outline:"none"}} />
              </div>
              <div style={{marginBottom:14}}>
                <label style={{fontSize:12, fontWeight:700, color:"var(--gray-600)", display:"block", marginBottom:6}}>Description *</label>
                <textarea value={form.description} onChange={e => setForm(p => ({...p, description:e.target.value}))}
                  rows={4} placeholder="Describe your complaint in detail..." required
                  style={{width:"100%", border:"1.5px solid var(--gray-200)", borderRadius:8, padding:"10px 14px", fontSize:13, outline:"none", resize:"vertical", fontFamily:"inherit"}} />
              </div>
              <div style={{marginBottom:20}}>
                <label style={{fontSize:12, fontWeight:700, color:"var(--gray-600)", display:"block", marginBottom:6}}>Priority</label>
                <select value={form.priority} onChange={e => setForm(p => ({...p, priority:e.target.value}))}
                  style={{border:"1.5px solid var(--gray-200)", borderRadius:8, padding:"10px 14px", fontSize:13, outline:"none"}}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <button type="submit" className="btn-primary-pd" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Complaint"}
              </button>
            </form>
          </div>
        )}

        {/* List */}
        {loading ? <div className="pd-spinner" /> :
          complaints.length === 0 ? (
            <div className="pd-empty"><MessageSquare size={40} /><p>No complaints filed yet</p></div>
          ) : (
            <div style={{display:"flex", flexDirection:"column", gap:12}}>
              {complaints.map(c => (
                <div key={c.id} style={{background:"white", borderRadius:12, border:"1px solid var(--gray-200)", padding:20}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8, marginBottom:10}}>
                    <div>
                      <p style={{fontWeight:700, fontSize:15, marginBottom:6}}>{c.subject}</p>
                      <span style={{fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:99, background:"var(--gray-100)", color:PRIORITY_COLOR[c.priority]||"var(--gray-600)", textTransform:"capitalize"}}>
                        {c.priority} priority
                      </span>
                    </div>
                    <span style={{fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:99, background:S_BG[c.status]||"#F3F4F6", color:S_COLOR[c.status]||"#6B7280", textTransform:"capitalize"}}>
                      {c.status?.replace("_"," ")}
                    </span>
                  </div>
                  <p style={{fontSize:13, color:"var(--gray-600)", lineHeight:1.6}}>{c.description}</p>
                  {c.admin_note && (
                    <div style={{marginTop:10, background:"#F0FDF4", padding:"10px 14px", borderRadius:8, border:"1px solid #BBF7D0"}}>
                      <p style={{fontSize:11, fontWeight:700, color:"#16A34A", marginBottom:3}}>ADMIN RESPONSE</p>
                      <p style={{fontSize:13, color:"var(--gray-700)"}}>{c.admin_note}</p>
                    </div>
                  )}
                  <p style={{fontSize:11, color:"var(--gray-400)", marginTop:8}}>
                    Filed: {new Date(c.created_at).toLocaleDateString("en-PK")}
                  </p>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </Layout>
  );
}
