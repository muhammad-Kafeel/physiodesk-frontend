import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, ShieldCheck, Lock, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { patientAuthAPI, doctorAuthAPI, adminAuthAPI } from '../../api/services';
import { toast } from 'react-toastify';
import './AuthPages.css';

const API        = { patient: patientAuthAPI, doctor: doctorAuthAPI, admin: adminAuthAPI };
const LOGIN_PATH = { patient: '/patient/login', doctor: '/doctor/login', admin: '/admin/login' };

/* ─────────────────────────────────────────────────────────
   STEP 1 — Enter email → send OTP
   STEP 2 — Enter 6-digit OTP → verify, get reset_token
   STEP 3 — Enter new password → reset, redirect to login
───────────────────────────────────────────────────────── */

export default function ForgotPasswordPage({ role = 'patient' }) {
  const api      = API[role];
  const navigate = useNavigate();

  // Step state
  const [step,       setStep]       = useState(1);
  const [email,      setEmail]      = useState('');
  const [resetToken, setResetToken] = useState('');

  // OTP
  const [otpDigits,   setOtpDigits]   = useState(['','','','','','']);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);

  // Password step
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPwd,  setShowPwd]  = useState(false);

  // Loading flags
  const [sendingOtp,   setSendingOtp]   = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resetting,    setResetting]    = useState(false);

  // Countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  // ── Step 1: Send OTP ────────────────────────────────────────────────────
  const handleSendOtp = async e => {
    e.preventDefault();
    setSendingOtp(true);
    try {
      await api.forgotPassword({ email });
      toast.success('If an account exists, a reset code has been sent.');
      setStep(2);
      setResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  // ── OTP input handlers ──────────────────────────────────────────────────
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

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────
  const handleVerifyOtp = async e => {
    e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length < 6) { toast.error('Enter the full 6-digit code.'); return; }
    setVerifyingOtp(true);
    try {
      const { data } = await api.verifyResetOtp({ email, otp });
      setResetToken(data.data.reset_token);
      toast.success('Code verified. Set your new password.');
      setStep(3);
    } catch (err) {
      const msg = err.response?.data?.message || 'Incorrect code. Please try again.';
      toast.error(msg);
      if (err.response?.status === 429) {
        // Too many attempts — restart from step 1
        setStep(1); setOtpDigits(['','','','','','']); setResetToken('');
      }
    } finally {
      setVerifyingOtp(false);
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setSendingOtp(true);
    try {
      await api.forgotPassword({ email });
      toast.success('New code sent!');
      setOtpDigits(['','','','','','']); setResetToken('');
      setResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resend. Try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  // ── Step 3: Reset password ──────────────────────────────────────────────
  const handleReset = async e => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    setResetting(true);
    try {
      await api.resetPassword({ email, reset_token: resetToken, password, password_confirmation: confirm });
      toast.success('Password reset. You can now sign in.');
      navigate(LOGIN_PATH[role]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Reset failed. Please start over.';
      toast.error(msg);
      if (err.response?.status === 400) {
        // Token expired — restart
        setStep(1); setOtpDigits(['','','','','','']); setResetToken('');
        setPassword(''); setConfirm('');
      }
    } finally {
      setResetting(false);
    }
  };

  const isLoading = sendingOtp || verifyingOtp || resetting;

  // Accent color per role
  const accent = role === 'doctor' ? '#0F766E' : role === 'admin' ? '#1E293B' : '#014E78';
  const panelClass = role === 'doctor' ? 'ap-panel--teal' : role === 'admin' ? 'ap-panel--slate' : '';
  const btnClass   = role === 'doctor' ? 'ap-btn--teal'   : role === 'admin' ? 'ap-btn--slate'  : '';
  const boxClass   = role === 'doctor' ? 'ap-box--teal'   : role === 'admin' ? 'ap-box--slate'  : '';

  return (
    <div className="ap-page">
      <Link to="/" className={`ap-panel ${panelClass}`} style={{ textDecoration: 'none' }}>
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
        <div className={`ap-box ${boxClass}`}>

          {/* ── STEP 1: Email input ── */}
          {step === 1 && (
            <>
              <h1 className="ap-heading">Forgot password</h1>
              <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 20 }}>
                Enter the email for your {role} account and we'll send you a reset code.
              </p>
              <form onSubmit={handleSendOtp} className="ap-form">
                <div className="ap-field">
                  <label className="ap-label">Email</label>
                  <div className="ap-input-wrap">
                    <Mail size={14} className="ap-input-icon" />
                    <input className="ap-input" type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com" required autoComplete="email" />
                  </div>
                </div>
                <button className={`ap-btn ${btnClass}`} type="submit" disabled={isLoading}>
                  {sendingOtp ? <span className="ap-spin" /> : 'Send reset code'}
                </button>
              </form>
              <p className="ap-footer-link">
                <Link to={LOGIN_PATH[role]}>
                  <ArrowLeft size={12} style={{ verticalAlign: 'middle' }} /> Back to sign in
                </Link>
              </p>
            </>
          )}

          {/* ── STEP 2: OTP input ── */}
          {step === 2 && (
            <>
              <div style={{ marginBottom: 20, textAlign: 'center' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: '#FFF7ED', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 14px'
                }}>
                  <ShieldCheck size={26} color="#C2410C" />
                </div>
                <h1 className="ap-heading" style={{ marginBottom: 6 }}>Enter reset code</h1>
                <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
                  We sent a 6-digit code to<br />
                  <strong style={{ color: '#111827' }}>{email}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="ap-form">
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
                        borderColor: digit ? '#C2410C' : '#D1D5DB',
                        borderRadius: 10,
                        background: digit ? '#FFF7ED' : '#fff',
                        color: '#C2410C',
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
                <button className={`ap-btn ${btnClass}`} type="submit" disabled={isLoading}>
                  {verifyingOtp ? <span className="ap-spin" /> : 'Verify code'}
                </button>
              </form>

              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <button type="button" onClick={handleResend}
                  disabled={resendTimer > 0 || sendingOtp}
                  style={{
                    background: 'none', border: 'none',
                    cursor: resendTimer > 0 ? 'default' : 'pointer',
                    fontSize: 13, color: resendTimer > 0 ? '#9CA3AF' : accent,
                    fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5, padding: 0,
                  }}>
                  <RefreshCw size={12} />
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
                </button>
              </div>

              <p className="ap-footer-link" style={{ marginTop: 14 }}>
                <button type="button"
                  onClick={() => { setStep(1); setOtpDigits(['','','','','','']); setResetToken(''); }}
                  style={{ background: 'none', border: 'none', color: accent, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                  ← Change email
                </button>
              </p>
            </>
          )}

          {/* ── STEP 3: New password ── */}
          {step === 3 && (
            <>
              <h1 className="ap-heading">Set new password</h1>
              <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 20 }}>
                Choose a strong password for <strong>{email}</strong>.
              </p>
              <form onSubmit={handleReset} className="ap-form">
                <div className="ap-field">
                  <label className="ap-label">New password</label>
                  <div className="ap-input-wrap">
                    <Lock size={14} className="ap-input-icon" />
                    <input className="ap-input" type={showPwd ? 'text' : 'password'}
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Min 8 chars" required autoComplete="new-password" />
                    <button type="button" className="ap-eye" tabIndex={-1}
                      onClick={() => setShowPwd(p => !p)}>
                      {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="ap-field">
                  <label className="ap-label">Confirm password</label>
                  <div className="ap-input-wrap">
                    <Lock size={14} className="ap-input-icon" />
                    <input className="ap-input" type={showPwd ? 'text' : 'password'}
                      value={confirm} onChange={e => setConfirm(e.target.value)}
                      placeholder="Repeat" required autoComplete="new-password" />
                  </div>
                </div>
                <button className={`ap-btn ${btnClass}`} type="submit" disabled={isLoading}>
                  {resetting ? <span className="ap-spin" /> : 'Reset password'}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
