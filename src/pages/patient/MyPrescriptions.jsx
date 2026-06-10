import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FileText, Download, Calendar, ShoppingBag } from "lucide-react";
import Layout from "../../components/layout/Layout";
import { patientAPI } from "../../api/services";
import { toast } from "react-toastify";

function RxSkeleton() {
  return (
    <div style={{background:"white",borderRadius:12,border:"1px solid var(--gray-200)",padding:24,boxShadow:"var(--shadow-sm)"}}>
      {[70,45,90,60,80].map((w,i) => (
        <div key={i} style={{height:i===0?20:13,borderRadius:8,marginBottom:10,width:`${w}%`,
          background:"linear-gradient(90deg,var(--gray-100) 25%,var(--gray-200) 50%,var(--gray-100) 75%)",
          backgroundSize:"400px 100%",animation:"shimmer 1.4s infinite"}}/>
      ))}
    </div>
  );
}

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

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:12}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:800,color:"var(--gray-800)",marginBottom:4}}>My Prescriptions</h1>
            <p style={{fontSize:13,color:"var(--gray-400)"}}>Download and manage your doctor-issued prescriptions</p>
          </div>
        </div>

        {loading ? (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {[1,2].map(i => <RxSkeleton key={i}/>)}
          </div>
        ) : rxs.length === 0 ? (
          <div className="pd-empty">
            <FileText size={44}/>
            <p style={{marginTop:12}}>No prescriptions yet</p>
            <p style={{fontSize:13,marginTop:6}}>Prescriptions will appear here after a completed consultation</p>
            <Link to="/doctors" className="btn-primary-pd" style={{marginTop:16}}>Book a Consultation</Link>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {rxs.map(rx => (
              <div key={rx.id} style={{background:"white",borderRadius:12,border:"1px solid var(--gray-200)",padding:24,boxShadow:"var(--shadow-sm)"}}>

                {/* Letterhead */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12,marginBottom:16,paddingBottom:16,borderBottom:"3px solid var(--primary)"}}>
                  <div>
                    <p style={{fontSize:11,fontWeight:700,color:"var(--primary)",textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>
                      PhysioDesk Virtual Clinic
                    </p>
                    <p style={{fontWeight:800,fontSize:17,marginBottom:3}}>Dr. {rx.doctor?.user?.name}</p>
                    <p style={{fontSize:13,color:"var(--teal)",fontWeight:600}}>{rx.doctor?.specialization}</p>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <p style={{fontSize:12,color:"var(--gray-400)",marginBottom:4}}>
                      <Calendar size={12} style={{display:"inline",marginRight:4}}/>
                      {new Date(rx.created_at).toLocaleDateString("en-PK",{day:"numeric",month:"long",year:"numeric"})}
                    </p>
                    <a href={`http://localhost:8000/api/prescriptions/${rx.id}/download`}
                      target="_blank" rel="noreferrer"
                      style={{display:"inline-flex",alignItems:"center",gap:6,background:"var(--primary)",color:"white",padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:700,textDecoration:"none"}}>
                      <Download size={14}/> Download PDF
                    </a>
                  </div>
                </div>

                {/* Diagnosis */}
                <div style={{background:"#FEF2F2",border:"1px solid #FECACA",padding:"12px 16px",borderRadius:8,marginBottom:14}}>
                  <p style={{fontSize:11,fontWeight:700,color:"#DC2626",marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>Diagnosis</p>
                  <p style={{fontSize:14,color:"var(--gray-800)",lineHeight:1.6}}>{rx.diagnosis}</p>
                </div>

                {/* Medicines */}
                {rx.medicines?.length > 0 && (
                  <div style={{marginBottom:14}}>
                    <p style={{fontSize:11,fontWeight:700,color:"var(--gray-600)",textTransform:"uppercase",letterSpacing:.5,marginBottom:10}}>
                      💊 Prescribed Medicines ({rx.medicines.length})
                    </p>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {rx.medicines.map((m, i) => (
                        <div key={i} style={{display:"grid",gridTemplateColumns:"auto 1fr 1fr 1fr",gap:12,alignItems:"center",background:"var(--primary-light)",padding:"12px 16px",borderRadius:8,flexWrap:"wrap"}}>
                          <span style={{width:24,height:24,borderRadius:"50%",background:"var(--primary)",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>
                            {i+1}
                          </span>
                          <p style={{fontWeight:700,color:"var(--gray-800)",fontSize:13}}>{m.name}</p>
                          <p style={{fontSize:13,color:"var(--gray-600)"}}>{m.dosage}</p>
                          <p style={{fontSize:12,color:"var(--gray-400)"}}>for {m.duration}</p>
                          {m.notes && (
                            <p style={{fontSize:12,color:"var(--gray-400)",fontStyle:"italic",gridColumn:"2/-1"}}>
                              Note: {m.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instructions */}
                {rx.instructions && (
                  <div style={{background:"#FFFBEB",border:"1px solid #FDE68A",padding:"12px 16px",borderRadius:8,marginBottom:10}}>
                    <p style={{fontSize:11,fontWeight:700,color:"#92400E",marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>Instructions</p>
                    <p style={{fontSize:13,color:"var(--gray-700)",lineHeight:1.6}}>{rx.instructions}</p>
                  </div>
                )}

                {/* Follow-up */}
                {rx.follow_up_date && (
                  <div style={{display:"flex",alignItems:"center",gap:8,marginTop:12}}>
                    <span style={{fontSize:13,color:"var(--amber)",fontWeight:700}}>
                      📅 Follow-up: {new Date(rx.follow_up_date).toLocaleDateString("en-PK",{day:"numeric",month:"long",year:"numeric"})}
                    </span>
                  </div>
                )}

                {/* Order medicines CTA */}
                <div style={{marginTop:16,paddingTop:14,borderTop:"1px solid var(--gray-200)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
                  <p style={{fontSize:13,color:"var(--gray-500)"}}>
                    Want to order these medicines?
                  </p>
                  <Link to="/pharmacy" className="btn-outline-pd" style={{fontSize:13,padding:"7px 16px"}}>
                    <ShoppingBag size={14}/> Go to Pharmacy
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
