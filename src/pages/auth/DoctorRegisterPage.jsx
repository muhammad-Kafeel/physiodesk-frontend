import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff, ShieldCheck, RefreshCw } from 'lucide-react';
import { useDoctorAuth } from '../../context/AuthContext';
import { doctorAuthAPI } from '../../api/services';
import { toast } from 'react-toastify';
import './AuthPages.css';

/* ─────────────────────────────────────────────────────────
   STEP 1 — Doctor details form
   STEP 2 — Enter OTP sent to email
   STEP 3 — (invisible) Registration submitted → redirect
───────────────────────────────────────────────────────── */

export default function DoctorRegisterPage() {
  // Form fields
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    password: '', password_confirmation: '',
  });
  const [show,      setShow]      = useState(false);

  // OTP step state
  const [step,         setStep]         = useState(1);
  const [otpDigits,    setOtpDigits]    = useState(['','','','','','']);
  const [otpToken,     setOtpToken]     = useState('');
  const [sendingOtp,   setSendingOtp]   = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [registering,  setRegistering]  = useState(false);
  const [resendTimer,  setResendTimer]  = useState(0);

  const otpRefs = useRef([]);
  const { login }  = useDoctorAuth();
  const navigate   = useNavigate();

  // ── Countdown timer for resend ──────────────────────────────────────────
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  // ── Step 1: validate and send OTP ───────────────────────────────────────
  const handleSendOtp = async e => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Full name is required'); return; }
    if (form.password !== form.password_confirmation) {
      toast.error('Passwords do not match'); return;
    }

    setSendingOtp(true);
    try {
      await doctorAuthAPI.sendOtp({ email: form.email });
      toast.success('Verification code sent! Check your inbox.');
      setStep(2);
      setResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send code. Try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  // ── OTP input handling ──────────────────────────────────────────────────
  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otpDigits];
    next[idx] = val.slice(-1);
    setOtpDigits(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = e => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...otpDigits];
    pasted.split('').forEach((d, i) => { if (i < 6) next[i] = d; });
    setOtpDigits(next);
    const lastFilled = Math.min(pasted.length, 5);
    setTimeout(() => otpRefs.current[lastFilled]?.focus(), 0);
  };

  // ── Step 2: verify OTP, get token, then register ────────────────────────
  const handleVerifyAndRegister = async e => {
    e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length < 6) { toast.error('Enter the full 6-digit code.'); return; }

    setVerifyingOtp(true);
    let token = otpToken;
    try {
      if (!token) {
        const { data } = await doctorAuthAPI.verifyOtp({ email: form.email, otp });
        token = data.data.verified_token;
        setOtpToken(token);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Incorrect code. Please try again.';
      toast.error(msg);
      if (err.response?.status === 429) {
        setStep(1); setOtpDigits(['','','','','','']); setOtpToken('');
      }
      setVerifyingOtp(false);
      return;
    }
    setVerifyingOtp(false);

    setRegistering(true);
    try {
      const { data } = await doctorAuthAPI.register({ ...form, otp_token: token });
      const { user, token: authToken } = data.data;
      login(user, authToken);
      toast.success('Account created! Please complete your profile.');
      navigate('/doctor/profile?welcome=1');
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (errs) Object.values(errs).flat().forEach(m => toast.error(m));
      else toast.error(err.response?.data?.message || 'Registration failed');
      if (err.response?.status === 422) {
        setOtpToken(''); setOtpDigits(['','','','','','']); setStep(2);
      }
    } finally {
      setRegistering(false);
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setSendingOtp(true);
    try {
      await doctorAuthAPI.sendOtp({ email: form.email });
      toast.success('New code sent!');
      setOtpDigits(['','','','','','']);
      setOtpToken('');
      setResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resend. Try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const isLoading = sendingOtp || verifyingOtp || registering;

  return (
    <div className="ap-page">
      <Link to="/" className="ap-panel ap-panel--teal" style={{ textDecoration: 'none' }}>
        <div className="ap-wordmark">
          <div className="ap-wordmark-icon">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <rect x="12" y="3" width="2" height="20" rx="1" fill="white"/>
              <rect x="3" y="12" width="20" height="2" rx="1" fill="white"/>
            </svg>
          </div>
          <span className="ap-wordmark-name">PhysioDesk</span>
        </div>
      </Link>

      <div className="ap-side">
        <div className="ap-box ap-box--teal">

          {/* ── STEP 1: Details form ── */}
          {step === 1 && (
            <>
              <h1 className="ap-heading">Create account</h1>
              <form onSubmit={handleSendOtp} className="ap-form">
                <div className="ap-field">
                  <label className="ap-label">Full name</label>
                  <div className="ap-input-wrap">
                    <User size={14} className="ap-input-icon" />
                    <input className="ap-input" name="name" type="text"
                      value={form.name} onChange={handle}
                      placeholder="Dr. Sara Malik" required />
                  </div>
                </div>

                <div className="ap-field">
                  <label className="ap-label">Email</label>
                  <div className="ap-input-wrap">
                    <Mail size={14} className="ap-input-icon" />
                    <input className="ap-input" name="email" type="email"
                      value={form.email} onChange={handle}
                      placeholder="doctor@example.com" required autoComplete="email" />
                  </div>
                </div>

                <div className="ap-field">
                  <label className="ap-label">Phone <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span></label>
                  <div className="ap-input-wrap">
                    <Phone size={14} className="ap-input-icon" />
                    <input className="ap-input" name="phone" type="tel"
                      value={form.phone} onChange={handle}
                      placeholder="+92-300-0000000" />
                  </div>
                </div>

                <div className="ap-row">
                  <div className="ap-field">
                    <label className="ap-label">Password</label>
                    <div className="ap-input-wrap">
                      <Lock size={14} className="ap-input-icon" />
                      <input className="ap-input" name="password"
                        type={show ? 'text' : 'password'}
                        value={form.password} onChange={handle}
                        placeholder="Min 8 chars" required />
                      <button type="button" className="ap-eye" tabIndex={-1}
                        onClick={() => setShow(p => !p)}>
                        {show ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div className="ap-field">
                    <label className="ap-label">Confirm</label>
                    <div className="ap-input-wrap">
                      <Lock size={14} className="ap-input-icon" />
                      <input className="ap-input" name="password_confirmation"
                        type={show ? 'text' : 'password'}
                        value={form.password_confirmation} onChange={handle}
                        placeholder="Repeat" required />
                    </div>
                  </div>
                </div>

                <button className="ap-btn ap-btn--teal" type="submit" disabled={isLoading}>
                  {sendingOtp ? <span className="ap-spin" /> : 'Continue'}
                </button>
              </form>

              <p className="ap-footer-link">
                Already have an account? <Link to="/doctor/login">Sign in</Link>
              </p>
            </>
          )}

          {/* ── STEP 2: OTP entry ── */}
          {step === 2 && (
            <>
              <div style={{ marginBottom: 20, textAlign: 'center' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: '#F0FDFA', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 14px'
                }}>
                  <ShieldCheck size={26} color="#0F766E" />
                </div>
                <h1 className="ap-heading" style={{ marginBottom: 6 }}>Verify your email</h1>
                <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
                  We sent a 6-digit code to<br />
                  <strong style={{ color: '#111827' }}>{form.email}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyAndRegister} className="ap-form">
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '4px 0 8px' }}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => otpRefs.current[idx] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      onPaste={idx === 0 ? handleOtpPaste : undefined}
                      style={{
                        width: 44, height: 52,
                        textAlign: 'center',
                        fontSize: 22, fontWeight: 700,
                        border: '1.5px solid',
                        borderColor: digit ? '#0F766E' : '#D1D5DB',
                        borderRadius: 10,
                        background: digit ? '#F0FDFA' : '#fff',
                        color: '#0F766E',
                        outline: 'none',
                        transition: 'border-color .15s, background .15s',
                        fontFamily: 'inherit',
                      }}
                    />
                  ))}
                </div>

                <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 2 }}>
                  Code expires in 10 minutes. Check spam if not received.
                </p>

                <button className="ap-btn ap-btn--teal" type="submit" disabled={isLoading}>
                  {(verifyingOtp || registering) ? <span className="ap-spin" /> : 'Verify & Create Account'}
                </button>
              </form>

              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendTimer > 0 || sendingOtp}
                  style={{
                    background: 'none', border: 'none', cursor: resendTimer > 0 ? 'default' : 'pointer',
                    fontSize: 13, color: resendTimer > 0 ? '#9CA3AF' : '#0F766E',
                    fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: 0,
                  }}
                >
                  <RefreshCw size={12} />
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
                </button>
              </div>

              <p className="ap-footer-link" style={{ marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtpDigits(['','','','','','']); setOtpToken(''); }}
                  style={{ background: 'none', border: 'none', color: '#0F766E', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                >
                  ← Change email
                </button>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
