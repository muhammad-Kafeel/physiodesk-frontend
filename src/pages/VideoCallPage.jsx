import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Video, Phone, ArrowLeft, Clock, Calendar } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { appointmentAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './VideoCallPage.css';

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

  useEffect(() => {
    appointmentAPI.getById(appointmentId)
      .then(r => {
        const appt = r.data.data;
        if (!appt.video_room_id) {
          toast.error('No video room yet. Doctor must confirm the appointment first.');
          navigate(-1);
          return;
        }
        if (appt.type !== 'video') {
          toast.error('This is an in-person appointment, not a video call.');
          navigate(-1);
          return;
        }
        setAppointment(appt);
      })
      .catch(() => { toast.error('Appointment not found'); navigate(-1); })
      .finally(() => setLoading(false));
  }, [appointmentId]);

  const startCall = () => {
    const script    = document.createElement('script');
    script.src      = 'https://meet.jit.si/external_api.js';
    script.async    = true;
    script.onload   = () => initJitsi();
    script.onerror  = () => toast.error('Failed to load Jitsi. Check your internet connection.');
    document.body.appendChild(script);
    setCallStarted(true);
  };

  const initJitsi = () => {
    if (!jitsiContainer.current || !appointment) return;

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
          'microphone','camera','desktop','fullscreen',
          'hangup','chat','raisehand','tileview','videoquality',
        ],
      },
    });

    jitsiApi.current.addEventListener('videoConferenceLeft', () => {
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

  if (loading) return (
    <Layout>
      <div style={{ textAlign:'center', paddingTop:80 }}>
        <div className="pd-spinner" />
        <p style={{ color:'var(--gray-400)', fontSize:14, marginTop:12 }}>
          Loading consultation room...
        </p>
      </div>
    </Layout>
  );

  if (!appointment) return null;

  const doc      = appointment.doctor?.user  || {};
  const pat      = appointment.patient?.user || {};
  const isDoctor = user?.role === 'doctor';

  return (
    <Layout noFooter>
      <div className="vc-wrap">

        {/* Top bar */}
        <div className="vc-topbar">
          <button className="vc-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={16}/> Back
          </button>
          <div className="vc-title-wrap">
            <div className={`vc-dot ${callStarted ? 'vc-dot-live' : ''}`} />
            <span className="vc-title">
              {callStarted ? '🔴 Live Consultation' : 'Video Consultation'}
            </span>
          </div>
          <div className="vc-appt-info">
            <span><Calendar size={13}/> {appointment.appointment_date}</span>
            <span><Clock size={13}/> {appointment.appointment_time}</span>
          </div>
        </div>

        <div className="vc-body">

          {/* Lobby */}
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
                  <div className="vc-call-icon"><Video size={26} color="white"/></div>
                  <div className="vc-participant">
                    <div className="vc-avatar vc-avatar-pat">{pat.name?.[0] || 'P'}</div>
                    <p className="vc-part-name">{pat.name}</p>
                    <p className="vc-part-role">Patient</p>
                  </div>
                </div>

                <h2 className="vc-lobby-title">Ready to join?</h2>
                <p className="vc-lobby-sub">
                  You'll be connected to a secure, encrypted video room.
                  Make sure your camera and microphone are allowed in your browser.
                </p>

                {/* Room info */}
                <div className="vc-room-info">
                  <div className="vc-room-row">
                    <span>Room ID</span>
                    <code>{appointment.video_room_id}</code>
                  </div>
                  <div className="vc-room-row">
                    <span>Platform</span>
                    <span>Jitsi Meet (Encrypted)</span>
                  </div>
                  <div className="vc-room-row">
                    <span>Type</span>
                    <span>📹 Video Call</span>
                  </div>
                </div>

                {/* Tips */}
                <div className="vc-tips">
                  <p className="vc-tips-title">Before you join:</p>
                  <ul>
                    <li>✅ Use Chrome or Firefox for best experience</li>
                    <li>✅ Allow camera & microphone when prompted</li>
                    <li>✅ Ensure you are in a quiet, well-lit area</li>
                    <li>✅ Stable internet connection required</li>
                  </ul>
                </div>

                <button className="vc-join-btn" onClick={startCall}>
                  <Video size={18}/> Join Video Call
                </button>
                <p className="vc-powered">Powered by Jitsi Meet · End-to-end encrypted</p>
              </div>
            </div>
          )}

          {/* Active call */}
          {callStarted && (
            <div className="vc-call-container">
              <div ref={jitsiContainer} className="vc-jitsi-frame" />
              <div className="vc-call-bar">
                <div className="vc-call-info">
                  <div className="vc-dot vc-dot-live" />
                  <span>Live — Dr. {doc.name} & {pat.name}</span>
                </div>
                <button className="vc-end-btn" onClick={endCall}>
                  <Phone size={15}/> End Call
                </button>
              </div>
            </div>
          )}

          {/* Call ended */}
          {callEnded && (
            <div className="vc-lobby">
              <div className="vc-lobby-card">
                <div className="vc-ended-icon">✅</div>
                <h2 className="vc-lobby-title">Consultation Ended</h2>
                <p className="vc-lobby-sub">
                  {isDoctor
                    ? 'You can now write a prescription for this patient.'
                    : 'Your prescription will be available once the doctor writes it.'}
                </p>
                <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginTop:8 }}>
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
                  <button className="btn-outline-pd" onClick={() => { setCallEnded(false); startCall(); }}>
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
