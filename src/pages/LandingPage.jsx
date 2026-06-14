import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Star, ThumbsUp, Video, MapPin, Pill, BookOpen, Shield, Clock, CreditCard } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

const SPECIALTIES = [
  { name: 'Physiotherapist',    slug: 'physiotherapist',  color: '#EFF6FF', icon: '🦴' },
  { name: 'Orthopedic Surgeon', slug: 'orthopedic',       color: '#F0FDFA', icon: '🔬' },
  { name: 'Neurologist',        slug: 'neurologist',      color: '#FEF9C3', icon: '🧠' },
  { name: 'Sports Medicine',    slug: 'sports-medicine',  color: '#FFF7ED', icon: '⚡' },
  { name: 'Rheumatologist',     slug: 'rheumatologist',   color: '#FDF4FF', icon: '💊' },
  { name: 'General Physician',  slug: 'general-physician',color: '#F0FDF4', icon: '👨‍⚕️' },
  { name: 'Chiropractor',       slug: 'chiropractor',     color: '#FFF1F2', icon: '🏃' },
  { name: 'Pain Specialist',    slug: 'pain-specialist',  color: '#ECFDF5', icon: '🩺' },
];

const CONDITIONS = [
  { name: 'Back Pain',         slug: 'back-pain'         },
  { name: 'Neck Pain',         slug: 'neck-pain'         },
  { name: 'Knee Injury',       slug: 'knee-injury'       },
  { name: 'Shoulder Pain',     slug: 'shoulder-pain'     },
  { name: 'Sports Injury',     slug: 'sports-injury'     },
  { name: 'Arthritis',         slug: 'arthritis'         },
  { name: 'Post-Surgery Rehab',slug: 'post-surgery-rehab'},
  { name: 'Paralysis',         slug: 'paralysis'         },
];

const REVIEWS = [
  { name: 'Ahmed Raza',    stars: 5, mood: 'Excellent', color: '#EFF6FF',
    text: 'PhysioDesk made it so easy to consult a physiotherapist without leaving home. The video call quality was great and the doctor was very professional.' },
  { name: 'Sara Malik',    stars: 5, mood: 'Satisfied', color: '#F0FDFA',
    text: 'I had severe back pain and got a same-day appointment. The doctor gave me a detailed exercise plan and prescribed medicine directly through the app.' },
  { name: 'Bilal Ahmed',   stars: 4, mood: 'Good',      color: '#FEF9C3',
    text: 'Excellent service! The prescription PDF feature is very convenient. I used it to order medicines from the pharmacy right after my consultation.' },
  { name: 'Fatima Khan',   stars: 5, mood: 'Excellent', color: '#EFF6FF',
    text: 'Best healthcare platform in Pakistan. The doctor verified my PMDC number and the whole process was smooth. Highly recommended for physiotherapy.' },
];

const WHY_POINTS = [
  { n: 1, icon: <Shield size={22} />, title: 'PMDC Verified Doctors', sub: 'All physiotherapists are verified before listing' },
  { n: 2, icon: <Clock size={22} />,  title: '24/7 Availability',      sub: 'Book appointments any time, day or night' },
  { n: 3, icon: <CreditCard size={22} />, title: 'Secure Payments', sub: 'JazzCash, EasyPaisa, Bank Transfer supported' },
];

function StarRow({ count }) {
  return (
    <div className="lp-stars">
      {Array.from({ length: count }).map((_, i) => <Star key={i} size={13} fill="#F5960B" color="#F5960B" />)}
    </div>
  );
}

export default function LandingPage() {
  const [city,    setCity]    = useState('Lahore');
  const [query,   setQuery]   = useState('');
  const [cityDrop, setCityDrop] = useState(false);
  const navigate = useNavigate();
  const { user, isPatient } = useAuth();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/doctors?q=${encodeURIComponent(query)}`);
    else navigate('/doctors');
  };

  const cities = ['Lahore','Karachi','Islamabad','Rawalpindi','Multan','Peshawar'];

  return (
    <Layout>
      <div className="lp-page" onClick={() => setCityDrop(false)}>

        {/* ── Hero / Greeting ── */}
        <div className="lp-hero">
          <div className="pd-container">
            <div className="lp-greet-row">
              <div className="lp-greet-avatar">{user?.name?.[0] || 'G'}</div>
              <p className="lp-greet-text">Hello, {user?.name?.split(' ')[0] || 'Guest'}!</p>
            </div>
            <h1 className="lp-h1">Find the Best Physiotherapist Near You</h1>
            <p className="lp-sub">Book online consultations with verified doctors from Pakistan's top physiotherapy clinic platform</p>

            {/* Search */}
            <form onSubmit={handleSearch} className="lp-search" onClick={e => e.stopPropagation()}>
              <div className="lp-city-pick" onClick={() => setCityDrop(p => !p)}>
                <MapPin size={13} />
                <span>{city}</span>
                <ChevronRight size={11} style={{transform:'rotate(90deg)'}} />
                {cityDrop && (
                  <ul className="lp-city-drop" onClick={e => e.stopPropagation()}>
                    {cities.map(c => (
                      <li key={c} className={c === city ? 'active' : ''}
                        onClick={() => { setCity(c); setCityDrop(false); }}>{c}</li>
                    ))}
                  </ul>
                )}
              </div>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by Specialty, Doctor Name, or Condition..."
                className="lp-search-input"
              />
              <button type="submit" className="lp-search-btn">Search</button>
            </form>
          </div>
        </div>

        {/* ── How can we help you today? ── */}
        <div className="pd-container pd-section">
          <h2 className="lp-section-title">How can we help you today?</h2>
          <div className="lp-help-grid">

            {/* Left — big video card + 2 sub cards */}
            <div className="lp-help-left">
              <Link to="/doctors" className="lp-big-card lp-video-card">
                <div className="lp-big-card-text">
                  <p className="lp-big-card-title">Video Consultation</p>
                  <p className="lp-big-card-sub">PMDC Verified Physiotherapists</p>
                </div>
                <div className="lp-big-card-icon"><Video size={48} color="white" opacity={0.4} /></div>
              </Link>
              <div className="lp-help-sub-row">
                <Link to="/pharmacy" className="lp-sub-card lp-pharmacy-card">
                  <p className="lp-sub-card-title">Order Medicines</p>
                  <p className="lp-sub-card-sub">OTC & Prescription</p>
                  <Pill size={32} color="white" opacity={0.4} style={{marginTop:8}} />
                </Link>
                {isPatient() || !user ? (
                  <Link to={user ? "/patient/prescriptions" : "/register"} className="lp-sub-card lp-rx-card">
                    <p className="lp-sub-card-title">My Prescriptions</p>
                    <p className="lp-sub-card-sub">Download & Reorder</p>
                    <BookOpen size={32} color="white" opacity={0.4} style={{marginTop:8}} />
                  </Link>
                ) : null}
              </div>
            </div>

            {/* Right — quick links grid */}
            <div className="lp-help-right">
              <div className="lp-quick-grid">
                {[
                  { to: '/doctors', label: 'Find Doctor',    bg: '#EFF6FF', icon: '👨‍⚕️' },
                  { to: '/pharmacy', label: 'Pharmacy',       bg: '#F0FDFA', icon: '💊' },
                  { to: '/blogs',    label: 'Health Blogs',   bg: '#FEF9C3', icon: '📖' },
                  { to: '/blogs?type=success_story', label: 'Success Stories', bg: '#FFF7ED', icon: '⭐' },
                  { to: user ? '/patient/appointments' : '/register', label: 'Appointments', bg: '#FDF4FF', icon: '📅' },
                  { to: user ? '/patient/medical-records' : '/register', label: 'Medical Records', bg: '#F0FDF4', icon: '🗂️' },
                ].map(item => (
                  <Link key={item.to + item.label} to={item.to} className="lp-quick-card" style={{ background: item.bg }}>
                    <span className="lp-quick-icon">{item.icon}</span>
                    <p className="lp-quick-label">{item.label}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Specialties ── */}
        <div className="pd-container pd-section">
          <div className="pd-section-head">
            <h2 className="pd-section-title">Browse by Specialty</h2>
            <Link to="/doctors" className="pd-view-all">View all <ChevronRight size={14} /></Link>
          </div>
          <div className="lp-spec-grid">
            {SPECIALTIES.map(s => (
              <Link key={s.slug} to={`/doctors?spec=${s.slug}`} className="lp-spec-card" style={{ background: s.color }}>
                <span className="lp-spec-icon">{s.icon}</span>
                <p className="lp-spec-name">{s.name}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Conditions ── */}
        <div className="pd-container pd-section">
          <div className="pd-section-head">
            <h2 className="pd-section-title">Common Conditions We Treat</h2>
            <Link to="/doctors" className="pd-view-all">View all <ChevronRight size={14} /></Link>
          </div>
          <div className="lp-cond-grid">
            {CONDITIONS.map(c => (
              <Link key={c.slug} to={`/doctors?condition=${c.slug}`} className="lp-cond-card">
                <div className="lp-cond-dot" />
                <p className="lp-cond-name">{c.name}</p>
                <ChevronRight size={14} color="var(--gray-400)" />
              </Link>
            ))}
          </div>
        </div>

        {/* ── Why PhysioDesk ── */}
        <div className="lp-why-section">
          <div className="pd-container">
            <h2 className="lp-section-title" style={{ color: 'white', marginBottom: 32 }}>Why PhysioDesk?</h2>
            <div className="lp-why-grid">
              {WHY_POINTS.map(p => (
                <div key={p.n} className="lp-why-card">
                  <div className="lp-why-icon">{p.icon}</div>
                  <div>
                    <p className="lp-why-title">{p.title}</p>
                    <p className="lp-why-sub">{p.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Patient Reviews ── */}
        <div className="pd-container pd-section">
          <h2 className="pd-section-title" style={{ marginBottom: 16 }}>What Our Patients Say</h2>
          <div className="pd-scroll-row">
            {REVIEWS.map((r, i) => (
              <div key={i} className="lp-review-card">
                <div className="lp-review-body">
                  <div className="lp-review-name">
                    <ThumbsUp size={16} color="var(--primary)" />
                    {r.name}
                  </div>
                  <p className="lp-review-text">{r.text}</p>
                </div>
                <div className="lp-review-footer" style={{ background: r.color }}>
                  <span className="lp-review-mood">{r.mood}</span>
                  <StarRow count={r.stars} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Are You A Doctor? Banner ── */}
        <div className="pd-container pd-section">
          <div className="lp-doctor-banner">
            <div className="lp-doctor-banner-text">
              <p className="lp-doctor-banner-title">Are You A Physiotherapist?</p>
              <p className="lp-doctor-banner-sub">Join PhysioDesk and connect with hundreds of patients looking for your expertise.</p>
              <div className="lp-doctor-banner-points">
                {['Verified PMDC profile','Set your own consultation fee','Video + In-person appointments'].map(t => (
                  <p key={t} className="lp-banner-point">✓ {t}</p>
                ))}
              </div>
              <Link to="/register/doctor" className="btn-primary-pd" style={{ marginTop: 16, display: 'inline-flex' }}>
                Join as Doctor
              </Link>
            </div>
            <div className="lp-doctor-banner-icon">👨‍⚕️</div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
