import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/services';
import { toast } from 'react-toastify';
import './AuthPages.css';

export default function LoginPage() {
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res  = await authAPI.login(form);
      const { user, token } = res.data.data;
      login(user, token);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      if (user.role === 'admin')   navigate('/admin/dashboard');
      else if (user.role === 'doctor')  navigate('/doctor/dashboard');
      else navigate('/patient/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
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
        <h1 className="auth-left-title">Pakistan's Trusted Physiotherapy Platform</h1>
        <p className="auth-left-sub">Connect with verified physiotherapists, book appointments, and get treated from home.</p>
        <div className="auth-stats">
          {[['500+','Verified Doctors'],['10K+','Happy Patients'],['24/7','Support']].map(([n,l]) => (
            <div key={l} className="auth-stat">
              <p className="auth-stat-n">{n}</p>
              <p className="auth-stat-l">{l}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-sub">Login to your PhysioDesk account</p>

          <form onSubmit={submit} className="auth-form">
            <div className="auth-field">
              <label>Email Address</label>
              <div className="auth-input-wrap">
                <Mail size={15} className="auth-input-icon" />
                <input name="email" type="email" value={form.email}
                  onChange={handle} placeholder="you@example.com" required />
              </div>
            </div>

            <div className="auth-field">
              <label>Password</label>
              <div className="auth-input-wrap">
                <Lock size={15} className="auth-input-icon" />
                <input name="password" type={show ? 'text' : 'password'}
                  value={form.password} onChange={handle} placeholder="••••••••" required />
                <button type="button" className="auth-eye" onClick={() => setShow(p => !p)}>
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <span className="auth-spinner" /> : 'Login'}
            </button>
          </form>

          {/* <div className="auth-divider"><span>Test Accounts</span></div>
          <div className="auth-test-accounts">
            {[
              { role: 'Admin',   email: 'admin@physiodesk.com',   pass: 'Admin@12345' },
              { role: 'Doctor',  email: 'doctor@physiodesk.com',  pass: 'Doctor@12345' },
              { role: 'Patient', email: 'patient@physiodesk.com', pass: 'Patient@12345' },
            ].map(a => (
              <button key={a.role} className="auth-test-btn"
                onClick={() => setForm({ email: a.email, password: a.pass })}>
                {a.role}
              </button>
            ))}
          </div> */}

          <p className="auth-switch">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
