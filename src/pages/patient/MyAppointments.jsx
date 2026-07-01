import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, Video, ChevronRight, MapPin, Star, X, RefreshCw, Loader2 } from "lucide-react";
import Layout from "../../components/layout/Layout";
import { appointmentAPI, reviewAPI, doctorAPI } from "../../api/services";
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

// ── Small inline star input ──────────────────────────────────────────────────
function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 30, lineHeight: 1, padding: 0,
            color: n <= (hover || value) ? "#F59E0B" : "#E5E7EB",
            transition: "color .15s",
          }}>★</button>
      ))}
    </div>
  );
}

// ── Reusable modal shell ─────────────────────────────────────────────────────
function Modal({ title, children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 16,
      }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "white", borderRadius: 14, width: "100%", maxWidth: 480,
          boxShadow: "0 20px 60px rgba(0,0,0,.2)", overflow: "hidden",
        }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 20px", borderBottom: "1px solid var(--gray-200)",
        }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: "var(--gray-800)" }}>{title}</p>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--gray-400)", padding: 4, display: "flex",
          }}><X size={18} /></button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

export default function MyAppointments() {
  const [appts,    setAppts]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("all");

  // Modals state
  const [reviewModal,     setReviewModal]     = useState(null); // appointment or null
  const [cancelModal,     setCancelModal]     = useState(null);
  const [rescheduleModal, setRescheduleModal] = useState(null);

  // Form state for the three modals
  const [rating,        setRating]        = useState(0);
  const [comment,       setComment]       = useState("");
  const [cancelReason,  setCancelReason]  = useState("");
  const [newDate,       setNewDate]       = useState("");
  const [newTime,       setNewTime]       = useState("");

  // Slot picker state
  const [slots,         setSlots]         = useState([]);   // available times for chosen date
  const [slotsLoading,  setSlotsLoading]  = useState(false);
  const [slotsUnavail,  setSlotsUnavail]  = useState(false); // doctor on leave

  const [submitting, setSubmitting] = useState(false);

  const loadAppointments = () => {
    setLoading(true);
    appointmentAPI.myAppointments()
      .then(r => setAppts(r.data.data.data || []))
      .catch(() => toast.error("Failed to load appointments"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAppointments(); }, []);

  // Fetch available slots whenever the date or modal changes
  const fetchSlots = useCallback(async (doctorId, date) => {
    if (!doctorId || !date) { setSlots([]); return; }
    setSlotsLoading(true);
    setSlotsUnavail(false);
    setNewTime("");
    try {
      const res = await doctorAPI.getAvailability(doctorId, date);
      const data = res.data.data;
      if (data.unavailable) {
        setSlotsUnavail(true);
        setSlots([]);
      } else {
        setSlots(data.available || []);
      }
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  const filtered = tab === "all" ? appts : appts.filter(a => a.status === tab);

  // ── Cancel handler ─────────────────────────────────────────────────────────
  const submitCancel = async () => {
    if (!cancelModal) return;
    setSubmitting(true);
    try {
      await appointmentAPI.cancel(cancelModal.id, { cancellation_reason: cancelReason });
      setAppts(p => p.map(a => a.id === cancelModal.id ? { ...a, status: "cancelled" } : a));
      toast.success("Appointment cancelled");
      setCancelModal(null);
      setCancelReason("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not cancel appointment");
    } finally { setSubmitting(false); }
  };

  // ── Review handler ─────────────────────────────────────────────────────────
  const submitReview = async () => {
    if (!reviewModal) return;
    if (!rating) { toast.error("Please pick a star rating"); return; }
    setSubmitting(true);
    try {
      const { data } = await reviewAPI.create(reviewModal.id, { rating, comment });
      // Optimistically attach the review to the appointment so the UI updates immediately.
      setAppts(p => p.map(a => a.id === reviewModal.id
        ? { ...a, review: data.data || { rating, comment } }
        : a));
      toast.success("Review submitted. Thank you!");
      setReviewModal(null);
      setRating(0); setComment("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally { setSubmitting(false); }
  };

  // ── Reschedule handler ─────────────────────────────────────────────────────
  const submitReschedule = async () => {
    if (!rescheduleModal) return;
    if (!newDate || !newTime) { toast.error("Please pick a date and a time slot"); return; }
    setSubmitting(true);
    try {
      await appointmentAPI.reschedule(rescheduleModal.id, {
        appointment_date: newDate,
        appointment_time: newTime,
      });
      toast.success("Appointment rescheduled");
      setRescheduleModal(null);
      setNewDate(""); setNewTime(""); setSlots([]);
      loadAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not reschedule");
    } finally { setSubmitting(false); }
  };

  const todayISO = new Date().toISOString().split("T")[0];

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
            <Calendar size={48}/>
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
                      {a.status === "confirmed" && a.is_paid && a.type === "video" && a.video_room_id && (
                        <Link to={`/video-call/${a.id}`} className="ma-video-btn">
                          <Video size={12}/> Join Call
                        </Link>
                      )}
                      {a.status === "confirmed" && a.is_paid && a.type !== "video" && (
                        <span style={{fontSize:11,fontWeight:700,color:"#16A34A",background:"#DCFCE7",padding:"5px 10px",borderRadius:7}}>✓ Paid</span>
                      )}
                      {a.status === "confirmed" && !a.is_paid && a.latest_payment?.status === "pending" && (
                        <span title="We're verifying your payment — this usually takes a few hours"
                          style={{fontSize:11,fontWeight:700,color:"#CA8A04",background:"#FEF9C3",padding:"5px 10px",borderRadius:7}}>
                          Payment under review
                        </span>
                      )}
                      {a.status === "confirmed" && !a.is_paid && a.latest_payment?.status !== "pending" && (
                        <Link to={`/payment/appointment/${a.id}`} className="ma-pay-btn">
                          Pay Now
                        </Link>
                      )}

                      {/* Reschedule (only when pending/confirmed and not paid yet — safer policy) */}
                      {["pending","confirmed"].includes(a.status) && !a.is_paid && (
                        <button className="ma-cancel-btn"
                          style={{ background: "#EFF6FF", color: "#2563EB" }}
                          onClick={() => {
                            const date = a.appointment_date || "";
                            setRescheduleModal(a);
                            setNewDate(date);
                            setNewTime("");
                            setSlots([]);
                            if (date) fetchSlots(a.doctor_id, date);
                          }}>
                          <RefreshCw size={11} style={{ marginRight: 4 }} />
                          Reschedule
                        </button>
                      )}

                      {["pending","confirmed"].includes(a.status) && (
                        <button className="ma-cancel-btn"
                          onClick={() => setCancelModal(a)}>
                          Cancel
                        </button>
                      )}

                      {/* Completed: Rx + Review */}
                      {a.status === "completed" && a.prescription?.id && (
                        <Link to={`/prescriptions/${a.prescription.id}`} className="ma-rx-btn">
                          <ChevronRight size={13}/> View Rx
                        </Link>
                      )}
                      {a.status === "completed" && !a.prescription?.id && (
                        <span style={{fontSize:11,color:"var(--gray-400)"}}>No Rx</span>
                      )}

                      {a.status === "completed" && a.review && (
                        <span style={{
                          fontSize:11, fontWeight:700, color:"#F59E0B",
                          background:"#FEF3C7", padding:"5px 10px", borderRadius:7,
                          display:"flex", alignItems:"center", gap:3,
                        }}>
                          ✓ Reviewed ({a.review.rating}★)
                        </span>
                      )}
                      {a.status === "completed" && !a.review && (
                        <button className="ma-pay-btn"
                          style={{ background: "#F59E0B" }}
                          onClick={() => setReviewModal(a)}>
                          <Star size={11} style={{ marginRight: 4 }} />
                          Rate Doctor
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Review Modal ──────────────────────────────────────────────────── */}
      {reviewModal && (
        <Modal title={`Rate Dr. ${reviewModal.doctor?.user?.name || ""}`}
          onClose={() => !submitting && setReviewModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 13, color: "var(--gray-600)" }}>
              How was your consultation? Your feedback helps other patients.
            </p>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--gray-700)", marginBottom: 6, display: "block" }}>
                Your Rating *
              </label>
              <StarPicker value={rating} onChange={setRating} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--gray-700)", marginBottom: 6, display: "block" }}>
                Your Review (optional)
              </label>
              <textarea rows={4}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Share your experience..."
                maxLength={1000}
                style={{
                  width: "100%", padding: "10px 12px", fontSize: 13,
                  border: "1px solid var(--gray-200)", borderRadius: 8,
                  resize: "vertical", fontFamily: "inherit", outline: "none",
                }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="ma-cancel-btn"
                onClick={() => setReviewModal(null)} disabled={submitting}>
                Cancel
              </button>
              <button className="ma-pay-btn"
                style={{ background: "#F59E0B" }}
                onClick={submitReview} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Cancel Modal ──────────────────────────────────────────────────── */}
      {cancelModal && (
        <Modal title="Cancel Appointment"
          onClose={() => !submitting && setCancelModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 13, color: "var(--gray-600)" }}>
              Cancel your appointment with <b>Dr. {cancelModal.doctor?.user?.name}</b> on {cancelModal.appointment_date} at {cancelModal.appointment_time}?
              {cancelModal.is_paid && (
                <span style={{ display: "block", marginTop: 8, padding: 10, background: "#FEF9C3", borderRadius: 8, color: "#92400E", fontSize: 12 }}>
                  ℹ️ You've already paid — a refund will be processed by our team.
                </span>
              )}
            </p>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--gray-700)", marginBottom: 6, display: "block" }}>
                Reason (optional)
              </label>
              <textarea rows={3}
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Let us know why — helps us improve."
                maxLength={500}
                style={{
                  width: "100%", padding: "10px 12px", fontSize: 13,
                  border: "1px solid var(--gray-200)", borderRadius: 8,
                  resize: "vertical", fontFamily: "inherit", outline: "none",
                }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="ma-cancel-btn"
                onClick={() => setCancelModal(null)} disabled={submitting}>
                Keep Appointment
              </button>
              <button className="ma-pay-btn"
                style={{ background: "#DC2626" }}
                onClick={submitCancel} disabled={submitting}>
                {submitting ? "Cancelling..." : "Cancel Appointment"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Reschedule Modal ──────────────────────────────────────────────── */}
      {rescheduleModal && (
        <Modal title="Reschedule Appointment"
          onClose={() => !submitting && (setRescheduleModal(null), setSlots([]))}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Info line */}
            <p style={{ fontSize: 13, color: "var(--gray-600)", margin: 0 }}>
              Pick a new date to see <b>Dr. {rescheduleModal.doctor?.user?.name}</b>'s available slots.
            </p>

            {/* Date picker */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--gray-700)", marginBottom: 6, display: "block" }}>
                New Date
              </label>
              <input
                type="date"
                value={newDate}
                min={todayISO}
                onChange={e => {
                  const d = e.target.value;
                  setNewDate(d);
                  fetchSlots(rescheduleModal.doctor_id, d);
                }}
                style={{
                  width: "100%", padding: "10px 12px", fontSize: 13,
                  border: "1px solid var(--gray-200)", borderRadius: 8,
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Slot grid */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--gray-700)", marginBottom: 8, display: "block" }}>
                Available Time Slots
                {newDate && !slotsLoading && slots.length > 0 && (
                  <span style={{ fontWeight: 400, color: "var(--gray-400)", marginLeft: 6 }}>
                    — {slots.length} slot{slots.length !== 1 ? "s" : ""} open
                  </span>
                )}
              </label>

              {/* States: no date chosen */}
              {!newDate && (
                <div style={{
                  padding: "18px 0", textAlign: "center",
                  color: "var(--gray-400)", fontSize: 13,
                }}>
                  Select a date above to view available slots.
                </div>
              )}

              {/* States: loading */}
              {newDate && slotsLoading && (
                <div style={{
                  padding: "18px 0", textAlign: "center",
                  color: "var(--gray-400)", fontSize: 13,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  Loading slots…
                </div>
              )}

              {/* States: doctor on leave */}
              {newDate && !slotsLoading && slotsUnavail && (
                <div style={{
                  padding: 12, borderRadius: 8,
                  background: "#FEF9C3", color: "#92400E", fontSize: 13,
                }}>
                  🚫 Dr. {rescheduleModal.doctor?.user?.name} is unavailable on this date. Please pick another day.
                </div>
              )}

              {/* States: no slots (but not on leave) */}
              {newDate && !slotsLoading && !slotsUnavail && slots.length === 0 && newDate && (
                <div style={{
                  padding: 12, borderRadius: 8,
                  background: "#FEE2E2", color: "#991B1B", fontSize: 13,
                }}>
                  No available slots on this date. Try a different day.
                </div>
              )}

              {/* States: slots available — pill grid */}
              {slots.length > 0 && !slotsLoading && (
                <div style={{
                  display: "flex", flexWrap: "wrap", gap: 8,
                  maxHeight: 180, overflowY: "auto",
                  padding: "4px 2px",
                }}>
                  {slots.map(t => {
                    const selected = newTime === t;
                    // Format: "09:00" → "9:00 AM"
                    const [h, m] = t.split(":").map(Number);
                    const label = `${h % 12 || 12}:${String(m).padStart(2,"0")} ${h < 12 ? "AM" : "PM"}`;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewTime(t)}
                        style={{
                          padding: "7px 14px",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: selected ? 700 : 500,
                          cursor: "pointer",
                          border: selected ? "2px solid #2563EB" : "1.5px solid var(--gray-200)",
                          background: selected ? "#EFF6FF" : "white",
                          color: selected ? "#2563EB" : "var(--gray-700)",
                          transition: "all .15s",
                          display: "flex", alignItems: "center", gap: 5,
                        }}
                      >
                        <Clock size={12} /> {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected summary */}
            {newDate && newTime && (
              <div style={{
                padding: "10px 14px", borderRadius: 8,
                background: "#EFF6FF", color: "#1D4ED8",
                fontSize: 13, display: "flex", alignItems: "center", gap: 8,
              }}>
                <Calendar size={14} />
                <span>
                  <b>{newDate}</b> at{" "}
                  <b>
                    {(() => {
                      const [h, m] = newTime.split(":").map(Number);
                      return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${h < 12 ? "AM" : "PM"}`;
                    })()}
                  </b>
                </span>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="ma-cancel-btn"
                onClick={() => { setRescheduleModal(null); setSlots([]); }}
                disabled={submitting}>
                Cancel
              </button>
              <button className="ma-pay-btn"
                style={{ background: "#2563EB", opacity: (!newDate || !newTime) ? 0.5 : 1 }}
                onClick={submitReschedule}
                disabled={submitting || !newDate || !newTime}>
                {submitting ? "Saving…" : "Confirm Reschedule"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
