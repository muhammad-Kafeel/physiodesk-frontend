import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Video, Phone, ArrowLeft, Clock, Calendar } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { appointmentAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './VideoCallPage.css';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '—';
  // appointment_date is "2026-06-12" — parse as local date to avoid timezone shift
  const [y, m, day] = d.toString().split('T')[0].split('-');
  return new Date(y, m - 1, day).toLocaleDateString('en-PK', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
};

const fmtTime = (t) => {
  if (!t) return '—';
  return t.toString().substring(0, 5); // "09:00:00" → "09:00"
};

/**
 * Returns an object describing whether the call can be joined right now.
 *   EARLY  — appointment is in the future (> 15 min away)
 *   OPEN   — within the joinable window (15 min before → 90 min after start)
 *   LATE   — appointment window has passed
 */
const getCallStatus = (apptDate, apptTime) => {
  if (!apptDate || !apptTime) return { status: 'OPEN', minutesUntil: 0 };

  const [y, m, d]   = apptDate.toString().split('T')[0].split('-').map(Number);
  const [h, min]    = apptTime.toString().split(':').map(Number);
  const apptStart   = new Date(y, m - 1, d, h, min, 0);
  const apptEnd     = new Date(apptStart.getTime() + 90 * 60 * 1000); // +90 min
  const openFrom    = new Date(apptStart.getTime() - 15 * 60 * 1000); // -15 min
  const now         = new Date();

  const minutesUntil = Math.round((openFrom - now) / 60000);

  if (now < openFrom) return { status: 'EARLY', minutesUntil };
  if (now > apptEnd)  return { status: 'LATE',  minutesUntil: 0 };
  return { status: 'OPEN', minutesUntil: 0 };
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function VideoCallPage() {
  const { appointmentId }             = useParams();
  const { user }                      = useAuth();
  const navigate                      = useNavigate();
  const jitsiContainer                = useRef(null);
  const jitsiApi                      = useRef(null);
  const [appointment, setAppointment] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [callStarted, setCallStarted] = useState(false);
  const [callEnded,   setCallEnded]   = useState(false);
  const [countdown,   setCountdown]   = useState(null); // minutes until joinable

  useEffect(() => {
    appointmentAPI.getById(appointmentId)
      .then(r => {
        const appt = r.data.data;
        if (!appt.video_room_id) {
          toast.error('No video room yet. Doctor must confirm the appointment first.');
          navigate(-1); return;
        }
        if (appt.type !== 'video') {
          toast.error('This is an in-person appointment — no video call needed.');
          navigate(-1); return;
        }
        setAppointment(appt);

        // Start countdown ticker if appointment is in the future
        const { status, minutesUntil } = getCallStatus(appt.appointment_date, appt.appointment_time);
        if (status === 'EARLY') setCountdown(minutesUntil);
      })
      .catch(() => { toast.error('Appointment not found'); navigate(-1); })
      .finally(() => setLoading(false));
  }, [appointmentId]);

  // Tick countdown every minute
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) { setCountdown(null); return; }
    const t = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(t); return null; }
        return prev - 1;
      });
    }, 60000);
    return () => clearInterval(t);
  }, [countdown]);

  const startCall = () => {
    if (!appointment) return;

    // ── Time window check ──────────────────────────────────────────────────
    const { status, minutesUntil } = getCallStatus(
      appointment.appointment_date,
      appointment.appointment_time,
    );

    if (status === 'EARLY') {
      const hrs = Math.floor(minutesUntil / 60);
      const min = minutesUntil % 60;
      const label = hrs > 0 ? `${hrs}h ${min}m` : `${min} minutes`;
      toast.error(`⏳ Too early! You can join ${label} before the appointment time.`);
      return;
    }

    if (status === 'LATE') {
      toast.error('⌛ This appointment time has passed. Please reschedule.');
      return;
    }

    // ── Load Jitsi ─────────────────────────────────────────────────────────
    if (window.JitsiMeetExternalAPI) {
      setCallStarted(true);
      setTimeout(() => initJitsi(), 100);
      return;
    }
    const script   = document.createElement('script');
    script.src     = 'https://meet.jit.si/external_api.js';
    script.async   = true;
    script.onload  = () => { setCallStarted(true); setTimeout(() => initJitsi(), 100); };
    script.onerror = () => { toast.error('Failed to load Jitsi. Check internet.'); setCallStarted(false); };
    document.body.appendChild(script);
    setCallStarted(true);
  };

  const initJitsi = () => {
    if (!jitsiContainer.current || !appointment || !window.JitsiMeetExternalAPI) return;
    if (jitsiApi.current) return;

    const roomName = `PhysioDesk-${appointment.video_room_id.replace(/[^a-zA-Z0-9]/g, '-')}`;
    const isDoctor = user?.role === 'doctor';

    jitsiApi.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
      roomName,
      width:      '100%',
      height:     '100%',
      parentNode: jitsiContainer.current,
      userInfo: {
        displayName: isDoctor ? `Dr. ${user?.name}` : user?.name,
        email:       user?.email,
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        enableWelcomePage:   false,
        disableDeepLinking:  true,
        prejoinPageEnabled:  false,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK:      false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        APP_NAME:                  'PhysioDesk',
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'desktop', 'fullscreen',
          'hangup', 'chat', 'raisehand', 'tileview', 'videoquality',
        ],
      },
    });

    jitsiApi.current.addEventListener('videoConferenceLeft', () => {
      jitsiApi.current = null;
      setCallEnded(true);
      setCallStarted(false);
    });
  };

  const endCall = () => {
    if (jitsiApi.current) {
      try { jitsiApi.current.executeCommand('hangup'); } catch {}
      try { jitsiApi.current.dispose(); } catch {}
      jitsiApi.current = null;
    }
    setCallEnded(true);
    setCallStarted(false);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <Layout>
      <div style={{ textAlign: 'center', paddingTop: 80 }}>
        <div className="pd-spinner" />
        <p style={{ color: 'var(--gray-400)', fontSize: 14, marginTop: 12 }}>
          Loading consultation room...
        </p>
      </div>
    </Layout>
  );

  if (!appointment) return null;

  const doc      = appointment.doctor?.user  || {};
  const pat      = appointment.patient?.user || {};
  const isDoctor = user?.role === 'doctor';
  const { status: callStatus } = getCallStatus(
    appointment.appointment_date,
    appointment.appointment_time,
  );

  return (
    <Layout noFooter>
      <div className="vc-wrap">

        {/* Top bar */}
        <div className="vc-topbar">
          <button className="vc-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
          <div className="vc-title-wrap">
            <div className={`vc-dot ${callStarted ? 'vc-dot-live' : ''}`} />
            <span className="vc-title">
              {callStarted ? '🔴 Live Consultation' : 'Video Consultation'}
            </span>
          </div>
          <div className="vc-appt-info">
            <span><Calendar size={13} /> {fmtDate(appointment.appointment_date)}</span>
            <span><Clock size={13} /> {fmtTime(appointment.appointment_time)}</span>
          </div>
        </div>

        <div className="vc-body">

          {/* ── Lobby ── */}
          {!callStarted && !callEnded && (
            <div className="vc-lobby">
              <div className="vc-lobby-card">

                {/* Participants */}
                <div className="vc-participants">
                  <div className="vc-participant">
                    <div className="vc-avatar vc-avatar-doc">{doc.name?.[0] || 'D'}</div>
                    <p className="vc-part-name">Dr. {doc.name}</p>
                    <p className="vc-part-role">Doctor</p>
                  </div>
                  <div className="vc-call-icon"><Video size={26} color="white" /></div>
                  <div className="vc-participant">
                    <div className="vc-avatar vc-avatar-pat">{pat.name?.[0] || 'P'}</div>
                    <p className="vc-part-name">{pat.name}</p>
                    <p className="vc-part-role">Patient</p>
                  </div>
                </div>

                <h2 className="vc-lobby-title">
                  {callStatus === 'EARLY' ? '⏳ Not Yet Time' :
                   callStatus === 'LATE'  ? '⌛ Appointment Ended' :
                   'Ready to join?'}
                </h2>

                {/* EARLY — show countdown */}
                {callStatus === 'EARLY' && (
                  <div className="vc-early-box">
                    <p className="vc-early-title">Your appointment starts at</p>
                    <p className="vc-early-time">
                      {fmtTime(appointment.appointment_time)} · {fmtDate(appointment.appointment_date)}
                    </p>
                    <p className="vc-early-sub">
                      You can join <strong>15 minutes before</strong> the scheduled time.
                      {countdown !== null && countdown > 0 && (
                        <span className="vc-countdown"> Opens in {countdown} min</span>
                      )}
                    </p>
                  </div>
                )}

                {/* LATE — appointment expired */}
                {callStatus === 'LATE' && (
                  <div className="vc-late-box">
                    <p>This appointment window has passed (90 minutes after start time).</p>
                    <p style={{ marginTop: 8 }}>Please contact support or book a new appointment.</p>
                  </div>
                )}

                {/* OPEN — show normal lobby */}
                {callStatus === 'OPEN' && (
                  <p className="vc-lobby-sub">
                    You'll be connected to a secure, encrypted video room.
                    Allow camera &amp; microphone when your browser asks.
                  </p>
                )}

                {/* Room info — always visible */}
                <div className="vc-room-info">
                  <div className="vc-room-row">
                    <span>Date</span>
                    <span>{fmtDate(appointment.appointment_date)}</span>
                  </div>
                  <div className="vc-room-row">
                    <span>Time</span>
                    <span>{fmtTime(appointment.appointment_time)}</span>
                  </div>
                  <div className="vc-room-row">
                    <span>Window</span>
                    <span>15 min before → 90 min after</span>
                  </div>
                  <div className="vc-room-row">
                    <span>Platform</span>
                    <span>Jitsi Meet (Encrypted)</span>
                  </div>
                </div>

                {/* Tips — only when OPEN */}
                {callStatus === 'OPEN' && (
                  <div className="vc-tips">
                    <p className="vc-tips-title">Before you join:</p>
                    <ul>
                      <li>✅ Use Chrome or Firefox for best experience</li>
                      <li>✅ Allow camera &amp; microphone when prompted</li>
                      <li>✅ Be in a quiet, well-lit area</li>
                      <li>✅ Stable internet connection required</li>
                    </ul>
                  </div>
                )}

                {/* Join button */}
                <button
                  className={`vc-join-btn ${callStatus !== 'OPEN' ? 'vc-join-disabled' : ''}`}
                  onClick={startCall}
                  disabled={callStatus !== 'OPEN'}
                >
                  <Video size={18} />
                  {callStatus === 'EARLY' ? `Opens in ${countdown ?? '...'} min` :
                   callStatus === 'LATE'  ? 'Appointment Expired' :
                   'Join Video Call'}
                </button>
                <p className="vc-powered">Powered by Jitsi Meet · End-to-end encrypted</p>
              </div>
            </div>
          )}

          {/* ── Active call ── */}
          {callStarted && (
            <div className="vc-call-container">
              <div ref={jitsiContainer} className="vc-jitsi-frame" />
              <div className="vc-call-bar">
                <div className="vc-call-info">
                  <div className="vc-dot vc-dot-live" />
                  <span>Live — Dr. {doc.name} &amp; {pat.name}</span>
                </div>
                <button className="vc-end-btn" onClick={endCall}>
                  <Phone size={15} /> End Call
                </button>
              </div>
            </div>
          )}

          {/* ── Call ended ── */}
          {callEnded && (
            <div className="vc-lobby">
              <div className="vc-lobby-card">
                <div className="vc-ended-icon">✅</div>
                <h2 className="vc-lobby-title">Consultation Ended</h2>
                <p className="vc-lobby-sub">
                  {isDoctor
                    ? 'The consultation is complete. You can now write a prescription.'
                    : 'Your prescription will be available once the doctor writes it.'}
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
                  {isDoctor && (
                    <Link to={`/doctor/write-prescription/${appointmentId}`} className="btn-primary-pd">
                      ✍️ Write Prescription
                    </Link>
                  )}
                  {!isDoctor && (
                    <Link to="/patient/appointments" className="btn-primary-pd">
                      📅 My Appointments
                    </Link>
                  )}
                  <button className="btn-outline-pd"
                    onClick={() => { setCallEnded(false); setTimeout(() => startCall(), 100); }}>
                    🔄 Rejoin Call
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
