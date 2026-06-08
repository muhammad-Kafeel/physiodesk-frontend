import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/services';
import { toast } from 'react-toastify';
import './AuthPages.css';

export default function RegisterPage() {
  const [params]  = useSearchParams();
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    password: '', password_confirmation: '',
    role: params.get('role') === 'doctor' ? 'doctor' : 'patient',
  });
  const [show, setShow]       = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      toast.error('Passwords do not match'); return;
    }
    setLoading(true);
    try {
      const res = await authAPI.register(form);
      const { user, token } = res.data.data;
      login(user, token);
      toast.success('Account created successfully!');
      if (user.role === 'doctor') navigate('/doctor/profile');
      else navigate('/patient/profile');
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        Object.values(errors).flat().forEach(msg => toast.error(msg));
      } else {
        toast.error(err.response?.data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">P</div>
          <div>
            <p className="auth-brand-name">PhysioDesk</p>
            <p className="auth-brand-tag">Virtual Clinic</p>
          </div>
        </div>
        <h1 className="auth-left-title">Join PhysioDesk Today</h1>
        <p className="auth-left-sub">
          {form.role === 'doctor'
            ? 'Create your doctor profile, get verified, and start consulting patients online.'
            : 'Create your account and get access to Pakistan\'s best physiotherapy platform.'}
        </p>
        <div className="auth-role-cards">
          {['patient', 'doctor'].map(r => (
            <button key={r}
              className={`auth-role-card ${form.role === r ? 'active' : ''}`}
              onClick={() => setForm(p => ({ ...p, role: r }))}>
              <span>{r === 'patient' ? '🏥' : '👨‍⚕️'}</span>
              <span>Register as {r.charAt(0).toUpperCase() + r.slice(1)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-sub">Register as a <strong>{form.role}</strong></p>

          <form onSubmit={submit} className="auth-form">
            <div className="auth-field">
              <label>Full Name</label>
              <div className="auth-input-wrap">
                <User size={15} className="auth-input-icon" />
                <input name="name" type="text" value={form.name}
                  onChange={handle} placeholder="Your full name" required />
              </div>
            </div>

            <div className="auth-field">
              <label>Email Address</label>
              <div className="auth-input-wrap">
                <Mail size={15} className="auth-input-icon" />
                <input name="email" type="email" value={form.email}
                  onChange={handle} placeholder="you@example.com" required />
              </div>
            </div>

            <div className="auth-field">
              <label>Phone Number</label>
              <div className="auth-input-wrap">
                <Phone size={15} className="auth-input-icon" />
                <input name="phone" type="tel" value={form.phone}
                  onChange={handle} placeholder="+92-300-0000000" />
              </div>
            </div>

            <div className="auth-row">
              <div className="auth-field">
                <label>Password</label>
                <div className="auth-input-wrap">
                  <Lock size={15} className="auth-input-icon" />
                  <input name="password" type={show ? 'text' : 'password'}
                    value={form.password} onChange={handle} placeholder="Min 8 chars" required />
                  <button type="button" className="auth-eye" onClick={() => setShow(p => !p)}>
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="auth-field">
                <label>Confirm Password</label>
                <div className="auth-input-wrap">
                  <Lock size={15} className="auth-input-icon" />
                  <input name="password_confirmation" type={show ? 'text' : 'password'}
                    value={form.password_confirmation} onChange={handle}
                    placeholder="Repeat password" required />
                </div>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <span className="auth-spinner" /> : `Create ${form.role.charAt(0).toUpperCase() + form.role.slice(1)} Account`}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
