import { useState, useEffect } from "react";
import { FileText, Download } from "lucide-react";
import Layout from "../../components/layout/Layout";
import { patientAPI } from "../../api/services";
import { toast } from "react-toastify";

export default function MyPrescriptions() {
  const [rxs,     setRxs]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientAPI.myPrescriptions()
      .then(r => setRxs(r.data.data.data || []))
      .catch(() => toast.error("Failed to load prescriptions"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="pd-container pd-section">
        <h1 style={{fontSize:22, fontWeight:800, color:"var(--gray-800)", marginBottom:20}}>My Prescriptions</h1>

        {loading ? <div className="pd-spinner" /> :
          rxs.length === 0 ? (
            <div className="pd-empty"><FileText size={40} /><p>No prescriptions yet</p></div>
          ) : (
            <div style={{display:"flex", flexDirection:"column", gap:16}}>
              {rxs.map(rx => (
                <div key={rx.id} style={{background:"white", borderRadius:12, border:"1px solid var(--gray-200)", padding:24}}>

                  {/* Header */}
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12, marginBottom:16, paddingBottom:16, borderBottom:"1px solid var(--gray-200)"}}>
                    <div>
                      <p style={{fontWeight:800, fontSize:16, marginBottom:3}}>Dr. {rx.doctor?.user?.name}</p>
                      <p style={{fontSize:13, color:"var(--primary)", fontWeight:600}}>{rx.doctor?.specialization}</p>
                      <p style={{fontSize:12, color:"var(--gray-400)", marginTop:4}}>
                        {new Date(rx.created_at).toLocaleDateString("en-PK", {day:"numeric", month:"long", year:"numeric"})}
                      </p>
                    </div>
                    <a href={`http://localhost:8000/api/prescriptions/${rx.id}/download`}
                      target="_blank" rel="noreferrer"
                      style={{display:"flex", alignItems:"center", gap:6, background:"var(--primary)", color:"white", padding:"9px 18px", borderRadius:8, fontSize:13, fontWeight:700, textDecoration:"none"}}>
                      <Download size={14} /> Download PDF
                    </a>
                  </div>

                  {/* Diagnosis */}
                  <div style={{background:"#FEF2F2", padding:"12px 16px", borderRadius:8, marginBottom:12}}>
                    <p style={{fontSize:11, fontWeight:700, color:"#DC2626", marginBottom:4, textTransform:"uppercase", letterSpacing:0.5}}>Diagnosis</p>
                    <p style={{fontSize:13, color:"var(--gray-800)", lineHeight:1.6}}>{rx.diagnosis}</p>
                  </div>

                  {/* Medicines */}
                  {rx.medicines?.length > 0 && (
                    <div style={{marginBottom:12}}>
                      <p style={{fontSize:11, fontWeight:700, color:"var(--gray-600)", textTransform:"uppercase", letterSpacing:0.5, marginBottom:8}}>Prescribed Medicines</p>
                      <div style={{display:"flex", flexDirection:"column", gap:6}}>
                        {rx.medicines.map((m, i) => (
                          <div key={i} style={{display:"flex", gap:12, fontSize:13, background:"var(--primary-light)", padding:"10px 14px", borderRadius:8, flexWrap:"wrap"}}>
                            <span style={{fontWeight:700, color:"var(--primary)", minWidth:24}}>{i+1}.</span>
                            <span style={{fontWeight:700, color:"var(--gray-800)"}}>{m.name}</span>
                            <span style={{color:"var(--gray-600)"}}>{m.dosage}</span>
                            <span style={{color:"var(--gray-400)"}}>for {m.duration}</span>
                            {m.notes && <span style={{color:"var(--gray-400)", fontStyle:"italic"}}>({m.notes})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Instructions */}
                  {rx.instructions && (
                    <div style={{background:"#FFFBEB", padding:"10px 14px", borderRadius:8, marginBottom:8}}>
                      <p style={{fontSize:11, fontWeight:700, color:"#92400E", marginBottom:3, textTransform:"uppercase"}}>Instructions</p>
                      <p style={{fontSize:13, color:"var(--gray-700)"}}>{rx.instructions}</p>
                    </div>
                  )}

                  {rx.follow_up_date && (
                    <p style={{fontSize:13, color:"var(--amber)", fontWeight:600, marginTop:8}}>
                      📅 Follow-up: {rx.follow_up_date}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )
        }
      </div>
    </Layout>
  );
}
