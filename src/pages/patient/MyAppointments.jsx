import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, Video, ChevronRight } from "lucide-react";
import Layout from "../../components/layout/Layout";
import { appointmentAPI } from "../../api/services";
import { toast } from "react-toastify";
import "./MyAppointments.css";

const STATUS_STYLE = {
  pending:     { bg:"#FEF9C3", c:"#CA8A04" },
  confirmed:   { bg:"#DCFCE7", c:"#16A34A" },
  completed:   { bg:"#DBEAFE", c:"#2563EB" },
  cancelled:   { bg:"#FEE2E2", c:"#DC2626" },
  rescheduled: { bg:"#FEF9C3", c:"#CA8A04" },
};

export default function MyAppointments() {
  const [appts,   setAppts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("all");

  useEffect(() => {
    appointmentAPI.myAppointments()
      .then(r => setAppts(r.data.data.data || []))
      .catch(() => toast.error("Failed to load appointments"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === "all" ? appts : appts.filter(a => a.status === tab);

  const cancel = async (id) => {
    try {
      await appointmentAPI.cancel(id, {});
      setAppts(p => p.map(a => a.id === id ? { ...a, status:"cancelled" } : a));
      toast.success("Appointment cancelled");
    } catch {
      toast.error("Could not cancel appointment");
    }
  };

  return (
    <Layout>
      <div className="pd-container pd-section">
        <div className="ma-header">
          <h1 className="ma-title">My Appointments</h1>
          <Link to="/doctors" className="btn-primary-pd">
            <Calendar size={15} /> Book New
          </Link>
        </div>

        <div className="ma-tabs">
          {["all","pending","confirmed","completed","cancelled"].map(t => (
            <button key={t} className={`ma-tab ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {loading ? <div className="pd-spinner" /> :
          filtered.length === 0 ? (
            <div className="pd-empty">
              <p style={{fontSize:40}}>📅</p>
              <p>No appointments found</p>
              <Link to="/doctors" className="btn-primary-pd" style={{marginTop:12}}>Find a Doctor</Link>
            </div>
          ) : (
            <div className="ma-list">
              {filtered.map(a => {
                const s   = STATUS_STYLE[a.status] || STATUS_STYLE.pending;
                const doc = a.doctor?.user || {};
                return (
                  <div key={a.id} className="ma-card">
                    <div className="ma-card-left">
                      <div className="ma-avatar">{doc.name?.[0] || "D"}</div>
                      <div>
                        <p className="ma-doc-name">Dr. {doc.name}</p>
                        <p className="ma-doc-spec">{a.doctor?.specialization}</p>
                        <div className="ma-meta">
                          <Calendar size={12} /> {a.appointment_date}
                          <Clock size={12} /> {a.appointment_time}
                          <Video size={12} /> {a.type}
                        </div>
                      </div>
                    </div>
                    <div className="ma-card-right">
                      <span className="ma-status" style={{background:s.bg, color:s.c}}>
                        {a.status}
                      </span>
                      <p className="ma-fee">Rs. {Number(a.fee).toLocaleString()}</p>
                      <div className="ma-actions">
                        {a.status === "confirmed" && !a.is_paid && (
                          <Link to={`/payment/appointment/${a.id}`} className="ma-pay-btn">
                            Pay Now
                          </Link>
                        )}
                        {["pending","confirmed"].includes(a.status) && (
                          <button className="ma-cancel-btn" onClick={() => cancel(a.id)}>
                            Cancel
                          </button>
                        )}
                        {a.status === "completed" && (
                          <Link to="/patient/prescriptions" className="ma-rx-btn">
                            <ChevronRight size={13} /> View Rx
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }
      </div>
    </Layout>
  );
}
