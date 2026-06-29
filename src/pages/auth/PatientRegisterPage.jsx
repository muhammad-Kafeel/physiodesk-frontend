import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff, ShieldCheck, RefreshCw } from 'lucide-react';
import { usePatientAuth } from '../../context/AuthContext';
import { patientAuthAPI } from '../../api/services';
import { validatePakistaniPhone, validateEmail } from '../../utils/validation';
import { toast } from 'react-toastify';
import './AuthPages.css';

/* ─────────────────────────────────────────────────────────
   STEP 1 — Personal details form
   STEP 2 — Enter OTP sent to email
   STEP 3 — (invisible) Registration submitted → redirect
───────────────────────────────────────────────────────── */

export default function PatientRegisterPage() {
  // Form fields
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    password: '', password_confirmation: '',
  });
  const [show,       setShow]       = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');

  // OTP step state
  const [step,          setStep]          = useState(1);   // 1 = form, 2 = OTP
  const [otpDigits,     setOtpDigits]     = useState(['','','','','','']);
  const [otpToken,      setOtpToken]      = useState('');  // verified_token from backend
  const [sendingOtp,    setSendingOtp]    = useState(false);
  const [verifyingOtp,  setVerifyingOtp]  = useState(false);
  const [registering,   setRegistering]   = useState(false);
  const [resendTimer,   setResendTimer]   = useState(0);

  const otpRefs = useRef([]);
  const { login }  = usePatientAuth();
  const navigate   = useNavigate();

  // ── Countdown timer for resend ──────────────────────────────────────────
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  // ── Form field handler ──────────────────────────────────────────────────
  const handle = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (name === 'phone' && phoneError) setPhoneError('');
    if (name === 'email' && emailError) setEmailError('');
  };

  // ── Step 1: validate and send OTP ───────────────────────────────────────
  const handleSendOtp = async e => {
    e.preventDefault();

    const emailErr = validateEmail(form.email, { required: true });
    if (emailErr) { setEmailError(emailErr); toast.error(emailErr); return; }

    const phoneErr = validatePakistaniPhone(form.phone, { required: true });
    if (phoneErr) { setPhoneError(phoneErr); toast.error(phoneErr); return; }

    if (form.password !== form.password_confirmation) {
      toast.error('Passwords do not match'); return;
    }
    if (!form.name.trim()) { toast.error('Full name is required'); return; }

    setSendingOtp(true);
    try {
      await patientAuthAPI.sendOtp({ email: form.email });
      toast.success('Verification code sent! Check your inbox.');
      setStep(2);
      setResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send code. Try again.';
      toast.error(msg);
      // If email already registered, surface the error on the field.
      if (err.response?.status === 409) setEmailError(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  // ── OTP input handling ──────────────────────────────────────────────────
  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;          // digits only
    const next = [...otpDigits];
    next[idx] = val.slice(-1);               // only last digit (paste protection)
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
      // If we already have the token (re-click scenario), skip re-verify
      if (!token) {
        const { data } = await patientAuthAPI.verifyOtp({ email: form.email, otp });
        token = data.data.verified_token;
        setOtpToken(token);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Incorrect code. Please try again.';
      toast.error(msg);
      // If too many attempts, go back to step 1 with cleared OTP state
      if (err.response?.status === 429) {
        setStep(1); setOtpDigits(['','','','','','']); setOtpToken('');
      }
      setVerifyingOtp(false);
      return;
    }
    setVerifyingOtp(false);

    // OTP verified — now register
    setRegistering(true);
    try {
      const { data } = await patientAuthAPI.register({ ...form, otp_token: token });
      const { user, token: authToken } = data.data;
      login(user, authToken);
      toast.success('Account created! Welcome to PhysioDesk.');
      navigate('/patient/dashboard');
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (errs) Object.values(errs).flat().forEach(m => toast.error(m));
      else toast.error(err.response?.data?.message || 'Registration failed');
      // If OTP token expired during registration, restart
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
      await patientAuthAPI.sendOtp({ email: form.email });
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

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="ap-page">
      <Link to="/" className="ap-panel" style={{ textDecoration: 'none' }}>
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
        <div className="ap-box">
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
                      placeholder="Ahmed Raza" required />
                  </div>
                </div>

                <div className="ap-field">
                  <label className="ap-label">Email</label>
                  <div className="ap-input-wrap">
                    <Mail size={14} className="ap-input-icon" />
                    <input className="ap-input" name="email" type="email"
                      value={form.email} onChange={handle}
                      placeholder="you@example.com" required autoComplete="email"
                      style={emailError ? { borderColor: '#DC2626' } : {}} />
                  </div>
                  {emailError && (
                    <p style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>{emailError}</p>
                  )}
                </div>

                <div className="ap-field">
                  <label className="ap-label">Phone</label>
                  <div className="ap-input-wrap">
                    <Phone size={14} className="ap-input-icon" />
                    <input className="ap-input" name="phone" type="tel"
                      value={form.phone} onChange={handle}
                      placeholder="+923001234567 or 03001234567" required
                      style={phoneError ? { borderColor: '#DC2626' } : {}} />
                  </div>
                  {phoneError
                    ? <p style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>{phoneError}</p>
                    : <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                        Pakistani mobile only — used for appointment updates.
                      </p>
                  }
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

                <button className="ap-btn" type="submit" disabled={isLoading}>
                  {sendingOtp ? <span className="ap-spin" /> : 'Continue'}
                </button>
              </form>

              <p className="ap-footer-link">
                Already have an account? <Link to="/patient/login">Sign in</Link>
              </p>
            </>
          )}

          {/* ── STEP 2: OTP entry ── */}
          {step === 2 && (
            <>
              <div style={{ marginBottom: 20, textAlign: 'center' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: '#EFF6FF', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 14px'
                }}>
                  <ShieldCheck size={26} color="#014E78" />
                </div>
                <h1 className="ap-heading" style={{ marginBottom: 6 }}>Verify your email</h1>
                <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
                  We sent a 6-digit code to<br />
                  <strong style={{ color: '#111827' }}>{form.email}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyAndRegister} className="ap-form">
                {/* OTP digit inputs */}
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
                        borderColor: digit ? '#014E78' : '#D1D5DB',
                        borderRadius: 10,
                        background: digit ? '#EFF6FF' : '#fff',
                        color: '#014E78',
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

                <button className="ap-btn" type="submit" disabled={isLoading}>
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
                    fontSize: 13, color: resendTimer > 0 ? '#9CA3AF' : '#014E78',
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
                  style={{ background: 'none', border: 'none', color: '#014E78', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
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
