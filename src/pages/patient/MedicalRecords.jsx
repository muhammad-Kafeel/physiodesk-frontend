import { useState, useEffect } from "react";
import { Activity, Lock } from "lucide-react";
import Layout from "../../components/layout/Layout";
import { patientAPI } from "../../api/services";
import { toast } from "react-toastify";

export default function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientAPI.myMedicalRecords()
      .then(r => setRecords(r.data.data.data || []))
      .catch(() => toast.error("Failed to load records"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="pd-container pd-section">
        <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:20}}>
          <h1 style={{fontSize:22, fontWeight:800, color:"var(--gray-800)"}}>Medical Records</h1>
          <span style={{background:"#DCFCE7", color:"#16A34A", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99, display:"flex", alignItems:"center", gap:4}}>
            <Lock size={11} /> Encrypted Vault
          </span>
        </div>

        {loading ? <div className="pd-spinner" /> :
          records.length === 0 ? (
            <div className="pd-empty">
              <Activity size={40} />
              <p>No medical records yet</p>
              <p style={{fontSize:13, marginTop:8}}>Your doctor will create records after your consultation</p>
            </div>
          ) : (
            <div style={{display:"flex", flexDirection:"column", gap:16}}>
              {records.map(r => (
                <div key={r.id} style={{background:"white", borderRadius:12, border:"1px solid var(--gray-200)", padding:24}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8, marginBottom:16, paddingBottom:14, borderBottom:"1px solid var(--gray-200)"}}>
                    <div>
                      <p style={{fontWeight:800, fontSize:16, marginBottom:3}}>{r.title}</p>
                      <p style={{fontSize:13, color:"var(--primary)", fontWeight:600}}>Dr. {r.doctor?.user?.name}</p>
                    </div>
                    <p style={{fontSize:12, color:"var(--gray-400)", background:"var(--gray-100)", padding:"4px 10px", borderRadius:6}}>{r.record_date}</p>
                  </div>

                  <div style={{display:"flex", flexDirection:"column", gap:10}}>
                    <div style={{background:"#FEF2F2", padding:"12px 16px", borderRadius:8}}>
                      <p style={{fontSize:11, fontWeight:700, color:"#DC2626", marginBottom:4, textTransform:"uppercase"}}>Diagnosis</p>
                      <p style={{fontSize:13, color:"var(--gray-800)", lineHeight:1.6}}>{r.diagnosis}</p>
                    </div>
                    {r.treatment && (
                      <div style={{background:"#F0FDF4", padding:"12px 16px", borderRadius:8}}>
                        <p style={{fontSize:11, fontWeight:700, color:"#16A34A", marginBottom:4, textTransform:"uppercase"}}>Treatment Plan</p>
                        <p style={{fontSize:13, color:"var(--gray-800)", lineHeight:1.6}}>{r.treatment}</p>
                      </div>
                    )}
                    {r.notes && (
                      <div style={{background:"var(--gray-50)", padding:"12px 16px", borderRadius:8}}>
                        <p style={{fontSize:11, fontWeight:700, color:"var(--gray-600)", marginBottom:4, textTransform:"uppercase"}}>Notes</p>
                        <p style={{fontSize:13, color:"var(--gray-600)", lineHeight:1.6}}>{r.notes}</p>
                      </div>
                    )}
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
