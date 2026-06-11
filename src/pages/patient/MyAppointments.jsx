import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, Video, ChevronRight, MapPin } from "lucide-react";
import Layout from "../../components/layout/Layout";
import { appointmentAPI } from "../../api/services";
import { ListSkeleton } from "../../components/common/Skeleton";
import { toast } from "react-toastify";
import "./MyAppointments.css";

const TABS = ["all","pending","confirmed","completed","cancelled"];

const STATUS_STYLE = {
  pending:     { bg:"#FEF9C3", c:"#CA8A04" },
  confirmed:   { bg:"#DCFCE7", c:"#16A34A" },
  completed:   { bg:"#DBEAFE", c:"#2563EB" },
  cancelled:   { bg:"#FEE2E2", c:"#DC2626" },
  rescheduled: { bg:"#FEF9C3", c:"#CA8A04" },
};

export default function MyAppointments() {
  const [appts,    setAppts]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("all");
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    appointmentAPI.myAppointments()
      .then(r => setAppts(r.data.data.data || []))
      .catch(() => toast.error("Failed to load appointments"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === "all" ? appts : appts.filter(a => a.status === tab);

  const cancel = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    setCancelling(id);
    try {
      await appointmentAPI.cancel(id, {});
      setAppts(p => p.map(a => a.id === id ? { ...a, status:"cancelled" } : a));
      toast.success("Appointment cancelled");
    } catch {
      toast.error("Could not cancel appointment");
    } finally { setCancelling(null); }
  };

  return (
    <Layout>
      <div className="pd-container pd-section">

        {/* Header */}
        <div className="ma-header">
          <div>
            <h1 className="ma-title">My Appointments</h1>
            <p className="ma-sub">Manage your upcoming and past consultations</p>
          </div>
          <Link to="/doctors" className="btn-primary-pd">
            <Calendar size={15} /> Book New
          </Link>
        </div>

        {/* Tabs */}
        <div className="ma-tabs">
          {TABS.map(t => {
            const count = t === "all" ? appts.length : appts.filter(a => a.status === t).length;
            return (
              <button key={t} className={`ma-tab ${tab === t ? "active" : ""}`}
                onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {count > 0 && <span className="ma-tab-count">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* List */}
        {loading ? (
          <div className="ma-list">
            <ListSkeleton count={4} type="appt" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="pd-empty">
            <p style={{fontSize:48}}>📅</p>
            <p>No {tab === "all" ? "" : tab} appointments</p>
            <Link to="/doctors" className="btn-primary-pd" style={{marginTop:16}}>
              Find a Doctor
            </Link>
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
                    <div className="ma-info">
                      <p className="ma-doc-name">Dr. {doc.name}</p>
                      <p className="ma-doc-spec">{a.doctor?.specialization}</p>
                      <div className="ma-meta">
                        <span><Calendar size={12}/> {a.appointment_date}</span>
                        <span><Clock size={12}/> {a.appointment_time}</span>
                        <span>
                          {a.type === "video"
                            ? <><Video size={12}/> Video</>
                            : <><MapPin size={12}/> In-person</>
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="ma-card-right">
                    <span className="ma-status" style={{background:s.bg, color:s.c}}>
                      {a.status}
                    </span>
                    <p className="ma-fee">Rs. {Number(a.fee).toLocaleString()}</p>
                    <div className="ma-actions">
                      {a.status === "confirmed" && a.type === "video" && a.video_room_id && (
                        <Link to={`/video-call/${a.id}`} className="ma-video-btn">
                          <Video size={12}/> Join Call
                        </Link>
                      )}
                      {a.status === "confirmed" && !a.is_paid && (
                        <Link to={`/payment/appointment/${a.id}`} className="ma-pay-btn">
                          Pay Now
                        </Link>
                      )}
                      {["pending","confirmed"].includes(a.status) && (
                        <button className="ma-cancel-btn"
                          onClick={() => cancel(a.id)}
                          disabled={cancelling === a.id}>
                          {cancelling === a.id ? "..." : "Cancel"}
                        </button>
                      )}
                      {a.status === "completed" && (
                        <Link to="/patient/prescriptions" className="ma-rx-btn">
                          <ChevronRight size={13}/> View Rx
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

