import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import './AuthPages.css';

export default function RegisterChoicePage() {
  return (
    <div className="rc-page">
      <div className="rc-bar">
        <Link to="/" className="rc-bar-back">
          <ArrowLeft size={14} /> Back
        </Link>
        <Link to="/" className="rc-bar-brand">
          <div className="rc-bar-icon">P</div>
          <span className="rc-bar-name">PhysioDesk</span>
        </Link>
        <div style={{ width: 60 }} />
      </div>

      <div className="rc-body">
        <div className="rc-heading">
          <h1 className="rc-title">Create an account</h1>
          <p className="rc-sub">Choose your role to get started</p>
        </div>

        <div className="rc-cards">
          <Link to="/register/patient" className="rc-card rc-card--patient">
            <h2 className="rc-card-title">Patient</h2>
            <p className="rc-card-desc">
              Book appointments, manage prescriptions, and track your health records.
            </p>
            <div className="rc-cta rc-cta--patient">
              Get started <ChevronRight size={14} />
            </div>
          </Link>

          <Link to="/register/doctor" className="rc-card rc-card--doctor">
            <h2 className="rc-card-title">Doctor</h2>
            <p className="rc-card-desc">
              List your practice, manage appointments, and consult patients online.
            </p>
            <div className="rc-cta rc-cta--doctor">
              Join as doctor <ChevronRight size={14} />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
