import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight, Star, Video, MapPin, Shield, Clock, CreditCard,
  Bone, Brain, Zap, Pill, Stethoscope, Activity, HeartPulse,
  Microscope, Users, UserCheck, BookOpen, Calendar, Folder,
  CheckCircle, ArrowRight, PlayCircle
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

/* ─── Data ─────────────────────────────────────────────────── */
const SPECIALTIES = [
  { name: 'Physiotherapist',    slug: 'physiotherapist',  icon: <Activity size={26}/>,    color: '#EEF4FF', iconColor: '#014E78' },
  { name: 'Orthopedic Surgeon', slug: 'orthopedic',       icon: <Bone size={26}/>,        color: '#FFF7ED', iconColor: '#C2410C' },
  { name: 'Neurologist',        slug: 'neurologist',      icon: <Brain size={26}/>,       color: '#FAF5FF', iconColor: '#7C3AED' },
  { name: 'Sports Medicine',    slug: 'sports-medicine',  icon: <Zap size={26}/>,         color: '#F0FDFA', iconColor: '#0F766E' },
  { name: 'Rheumatologist',     slug: 'rheumatologist',   icon: <HeartPulse size={26}/>,  color: '#FFF1F2', iconColor: '#BE123C' },
  { name: 'General Physician',  slug: 'general-physician',icon: <Stethoscope size={26}/>, color: '#ECFDF5', iconColor: '#059669' },
  { name: 'Chiropractor',       slug: 'chiropractor',     icon: <Users size={26}/>,       color: '#FEF9C3', iconColor: '#A16207' },
  { name: 'Pain Specialist',    slug: 'pain-specialist',  icon: <Shield size={26}/>,      color: '#EEF4FF', iconColor: '#014E78' },
];

const CONDITIONS = [
  'Back Pain','Neck Pain','Knee Injury','Shoulder Pain',
  'Sports Injury','Arthritis','Post-Surgery Rehab','Paralysis',
];

const STATS = [
  { value: '500+',  label: 'Verified Doctors', icon: <UserCheck size={22}/> },
  { value: '50K+',  label: 'Patients Served',  icon: <Users size={22}/> },
  { value: '4.8',   label: 'Average Rating',   icon: <Star size={22}/> },
  { value: '24/7',  label: 'Available Support', icon: <Clock size={22}/> },
];

const REVIEWS = [
  { name: 'Ahmed Raza',   stars: 5, city: 'Lahore',    text: 'PhysioDesk made it so easy to consult a physiotherapist without leaving home. The video call quality was great and the doctor was very professional.' },
  { name: 'Sara Malik',   stars: 5, city: 'Karachi',   text: 'I had severe back pain and got a same-day appointment. The doctor gave me a detailed exercise plan and prescribed medicine directly through the app.' },
  { name: 'Bilal Ahmed',  stars: 4, city: 'Islamabad', text: 'Excellent service! The prescription PDF feature is very convenient. I ordered medicines right after my consultation through the platform.' },
  { name: 'Fatima Khan',  stars: 5, city: 'Rawalpindi',text: 'Best healthcare platform in Pakistan. The whole booking process was smooth and hassle-free. Highly recommended for physiotherapy consultations.' },
];

const WHY_POINTS = [
  { icon: <Shield size={22}/>,     title: 'PMDC Verified Doctors',   sub: 'All physiotherapists verified before listing on our platform' },
  { icon: <Clock size={22}/>,      title: '24/7 Appointment Booking', sub: 'Book consultations any time, day or night, from anywhere' },
  { icon: <CreditCard size={22}/>, title: 'Secure Payment Gateway',   sub: 'JazzCash, EasyPaisa, and Bank Transfer supported' },
];

const CITIES = ['Lahore','Karachi','Islamabad','Rawalpindi','Multan','Peshawar'];

function StarRow({ count }) {
  return (
    <div className="lp-stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={13} fill={i < count ? '#F5960B' : 'none'} color={i < count ? '#F5960B' : '#CBD5E1'} />
      ))}
    </div>
  );
}

/* ─── Component ─────────────────────────────────────────────── */
export default function LandingPage() {
  const [city,     setCity]     = useState('Lahore');
  const [query,    setQuery]    = useState('');
  const [cityDrop, setCityDrop] = useState(false);
  const navigate = useNavigate();
  const { user, isPatient } = useAuth();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/doctors?q=${encodeURIComponent(query)}`);
    else navigate('/doctors');
  };

  return (
    <Layout>
      <div className="lp-page" onClick={() => setCityDrop(false)}>

        {/* ══ 1. HERO ══════════════════════════════════════════ */}
        <section className="lp-hero">
          <div className="pd-container lp-hero-inner">

            {/* Left: Headline + Search */}
            <div className="lp-hero-left">
              <div className="lp-hero-tag">
                <CheckCircle size={14} color="#059669"/> Pakistan's Most Trusted Physiotherapy Platform
              </div>
              <h1 className="lp-h1">
                Find & Book a<br/>
                <span className="lp-h1-accent">Specialist Doctor</span><br/>
                Near You
              </h1>
              <p className="lp-hero-sub">
                Connect with PMDC-verified physiotherapists, orthopedic surgeons, and specialists
                for online video consultations or in-person visits across Pakistan.
              </p>

              {/* Search */}
              <form onSubmit={handleSearch} className="lp-search" onClick={e => e.stopPropagation()}>
                <div className="lp-city-pick" onClick={() => setCityDrop(p => !p)}>
                  <MapPin size={14} />
                  <span>{city}</span>
                  <ChevronRight size={11} style={{ transform:'rotate(90deg)' }} />
                  {cityDrop && (
                    <ul className="lp-city-drop" onClick={e => e.stopPropagation()}>
                      {CITIES.map(c => (
                        <li key={c} className={c === city ? 'active' : ''}
                          onClick={() => { setCity(c); setCityDrop(false); }}>{c}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search by Doctor, Specialty, or Condition..."
                  className="lp-search-input"
                />
                <button type="submit" className="lp-search-btn">Search</button>
              </form>

              {/* Popular searches */}
              <div className="lp-popular">
                <span className="lp-popular-label">Popular:</span>
                {['Back Pain','Knee Pain','Sports Injury','Neck Pain'].map(s => (
                  <button key={s} className="lp-popular-tag"
                    onClick={() => navigate(`/doctors?q=${encodeURIComponent(s)}`)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Hero image */}
            <div className="lp-hero-right">
              <div className="lp-hero-img-wrap">
                <img
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=700&auto=format&fit=crop&q=80"
                  alt="Physiotherapist with patient"
                  className="lp-hero-img"
                />
                {/* Floating card 1 */}
                <div className="lp-hero-badge lp-hero-badge-1">
                  <CheckCircle size={16} color="#059669"/>
                  <div>
                    <p className="lp-fbadge-title">PMDC Verified</p>
                    <p className="lp-fbadge-sub">500+ Doctors</p>
                  </div>
                </div>
                {/* Floating card 2 */}
                <div className="lp-hero-badge lp-hero-badge-2">
                  <Video size={16} color="#014E78"/>
                  <div>
                    <p className="lp-fbadge-title">Video Consultation</p>
                    <p className="lp-fbadge-sub">Available Now</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ 2. TRUST STATS ═══════════════════════════════════ */}
        <section className="lp-stats-bar">
          <div className="pd-container lp-stats-inner">
            {STATS.map((s, i) => (
              <div key={i} className="lp-stat-item">
                <div className="lp-stat-icon">{s.icon}</div>
                <div>
                  <p className="lp-stat-value">{s.value}</p>
                  <p className="lp-stat-label">{s.label}</p>
                </div>
                {i < STATS.length - 1 && <div className="lp-stat-divider"/>}
              </div>
            ))}
          </div>
        </section>

        {/* ══ 3. HOW CAN WE HELP ═══════════════════════════════ */}
        <section className="pd-container pd-section">
          <div className="lp-section-head">
            <h2 className="lp-section-title">How Can We Help You?</h2>
            <p className="lp-section-sub">Everything you need for your health journey in one place</p>
          </div>

          <div className="lp-help-grid">
            {/* Big video card */}
            <Link to="/doctors" className="lp-big-card lp-video-card">
              <div className="lp-big-card-content">
                <div className="lp-big-card-icon-wrap">
                  <Video size={32} color="white" opacity={0.9}/>
                </div>
                <p className="lp-big-card-title">Video Consultation</p>
                <p className="lp-big-card-sub">PMDC Verified Physiotherapists available now</p>
                <span className="lp-big-card-cta">Book Now <ArrowRight size={14}/></span>
              </div>
              <div className="lp-big-card-bg-img"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=600&auto=format&fit=crop&q=80')" }}/>
            </Link>

            {/* Sub cards grid */}
            <div className="lp-help-sub">
              {[
                { to: '/pharmacy', icon: <Pill size={20}/>, label: 'Order Medicines', sub: 'OTC & Prescription delivery', bg: '#0D9488', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80' },
                { to: user ? '/patient/prescriptions' : '/register', icon: <BookOpen size={20}/>, label: 'My Prescriptions', sub: 'Download & Reorder', bg: '#7C3AED', img: '' },
              ].map(item => (
                <Link key={item.to} to={item.to} className="lp-sub-card" style={{ background: item.bg }}>
                  <div className="lp-sub-card-icon">{item.icon}</div>
                  <p className="lp-sub-card-title">{item.label}</p>
                  <p className="lp-sub-card-sub">{item.sub}</p>
                </Link>
              ))}
            </div>

            {/* Quick link grid */}
            <div className="lp-quick-grid">
              {[
                { to: '/doctors',                                         icon: <Stethoscope size={20}/>,  label: 'Find Doctor',      bg: '#EEF4FF', color: '#014E78' },
                { to: '/pharmacy',                                        icon: <Pill size={20}/>,         label: 'Pharmacy',         bg: '#EEFAF8', color: '#0D9488' },
                { to: '/blogs',                                           icon: <BookOpen size={20}/>,     label: 'Health Blogs',     bg: '#FEF3C7', color: '#A16207' },
                { to: '/blogs?type=success_story',                        icon: <Star size={20}/>,         label: 'Success Stories',  bg: '#FFF1F2', color: '#BE123C' },
                { to: user ? '/patient/appointments' : '/register',      icon: <Calendar size={20}/>,     label: 'Appointments',     bg: '#F5F3FF', color: '#7C3AED' },
                { to: user ? '/patient/medical-records' : '/register',   icon: <Folder size={20}/>,       label: 'Medical Records',  bg: '#ECFDF5', color: '#059669' },
              ].map(item => (
                <Link key={item.to + item.label} to={item.to} className="lp-quick-card"
                  style={{ background: item.bg, '--qc-color': item.color }}>
                  <div className="lp-quick-icon" style={{ color: item.color }}>{item.icon}</div>
                  <p className="lp-quick-label" style={{ color: item.color }}>{item.label}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ══ 4. SPECIALTIES ═══════════════════════════════════ */}
        <section className="pd-container pd-section">
          <div className="lp-section-head">
            <div>
              <h2 className="lp-section-title">Browse by Specialty</h2>
              <p className="lp-section-sub">Find the right specialist for your condition</p>
            </div>
            <Link to="/doctors" className="pd-view-all">View all <ChevronRight size={14}/></Link>
          </div>
          <div className="lp-spec-grid">
            {SPECIALTIES.map(s => (
              <Link key={s.slug} to={`/doctors?spec=${s.slug}`} className="lp-spec-card"
                style={{ background: s.color, '--spec-color': s.iconColor }}>
                <div className="lp-spec-icon-wrap" style={{ background: `${s.iconColor}18`, color: s.iconColor }}>
                  {s.icon}
                </div>
                <p className="lp-spec-name" style={{ color: s.iconColor }}>{s.name}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ══ 5. CONDITIONS ════════════════════════════════════ */}
        <section className="pd-container pd-section">
          <div className="lp-section-head">
            <div>
              <h2 className="lp-section-title">Common Conditions We Treat</h2>
              <p className="lp-section-sub">Connect with specialists for your specific needs</p>
            </div>
            <Link to="/doctors" className="pd-view-all">Browse all <ChevronRight size={14}/></Link>
          </div>
          <div className="lp-cond-grid">
            {CONDITIONS.map(c => (
              <Link key={c} to={`/doctors?condition=${encodeURIComponent(c.toLowerCase().replace(/ /g,'-'))}`}
                className="lp-cond-card">
                <div className="lp-cond-dot"/>
                <p className="lp-cond-name">{c}</p>
                <ChevronRight size={15} color="var(--gray-400)"/>
              </Link>
            ))}
          </div>
        </section>

        {/* ══ 6. WHY PHYSIODESK ════════════════════════════════ */}
        <section className="lp-why-section">
          <div className="pd-container">
            <div className="lp-why-inner">
              <div className="lp-why-text">
                <h2 className="lp-why-title">Why 50,000+ Patients<br/>Choose PhysioDesk</h2>
                <p className="lp-why-sub">We make quality healthcare accessible, affordable, and convenient for everyone in Pakistan.</p>
                <div className="lp-why-points">
                  {WHY_POINTS.map((p, i) => (
                    <div key={i} className="lp-why-point">
                      <div className="lp-why-icon">{p.icon}</div>
                      <div>
                        <p className="lp-why-point-title">{p.title}</p>
                        <p className="lp-why-point-sub">{p.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/doctors" className="lp-why-cta">
                  Find a Doctor Now <ArrowRight size={16}/>
                </Link>
              </div>
              <div className="lp-why-image">
                <img
                  src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=600&auto=format&fit=crop&q=80"
                  alt="Doctor consulting with patient"
                  className="lp-why-img"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ══ 7. PATIENT REVIEWS ═══════════════════════════════ */}
        <section className="pd-container pd-section">
          <div className="lp-section-head">
            <div>
              <h2 className="lp-section-title">What Our Patients Say</h2>
              <p className="lp-section-sub">Real experiences from verified patients across Pakistan</p>
            </div>
          </div>
          <div className="pd-scroll-row">
            {REVIEWS.map((r, i) => (
              <div key={i} className="lp-review-card">
                <div className="lp-review-header">
                  <div className="lp-review-avatar">
                    {r.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="lp-review-name">{r.name}</p>
                    <p className="lp-review-city">{r.city}</p>
                  </div>
                  <StarRow count={r.stars}/>
                </div>
                <p className="lp-review-text">{r.text}</p>
                <div className="lp-review-footer">
                  <CheckCircle size={14} color="#059669"/>
                  <span>Verified Patient</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ 8. JOIN AS DOCTOR ════════════════════════════════ */}
        <section className="pd-container pd-section">
          <div className="lp-doctor-cta">
            <div className="lp-doctor-cta-img-col">
              <img
                src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=500&auto=format&fit=crop&q=80"
                alt="Doctor with stethoscope"
                className="lp-doctor-cta-img"
              />
            </div>
            <div className="lp-doctor-cta-text">
              <div className="lp-hero-tag" style={{ background: 'rgba(255,255,255,.15)', color: 'white', borderColor: 'rgba(255,255,255,.25)' }}>
                <Stethoscope size={14}/> For Healthcare Professionals
              </div>
              <h2 className="lp-doctor-cta-title">Are You a Physiotherapist or Specialist?</h2>
              <p className="lp-doctor-cta-sub">Join PhysioDesk and connect with hundreds of patients seeking your expertise across Pakistan.</p>
              <div className="lp-doctor-cta-points">
                {[
                  'Verified PMDC profile with trust badge',
                  'Set your own consultation fee & schedule',
                  'Video + in-person appointment management',
                  'Integrated prescription & billing system',
                ].map(t => (
                  <div key={t} className="lp-cta-point">
                    <CheckCircle size={16} color="#86EFAC"/>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
              <Link to="/register/doctor" className="lp-doctor-cta-btn">
                Join as Doctor <ArrowRight size={16}/>
              </Link>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}
