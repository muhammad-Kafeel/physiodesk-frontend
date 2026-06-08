import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="pd-footer">
      <div className="pd-container">
        <div className="pd-footer-grid">

          {/* Brand */}
          <div className="pd-footer-brand">
            <div className="pd-footer-logo">
              <div className="pd-footer-logo-icon">P</div>
              <div>
                <span className="pd-footer-logo-text">PhysioDesk</span>
                <span className="pd-footer-logo-tag">Virtual Clinic</span>
              </div>
            </div>
            <p className="pd-footer-about">
              Pakistan's trusted virtual physiotherapy clinic. Connect with verified physiotherapists, book appointments, and get treated from the comfort of your home.
            </p>
            <div className="pd-footer-socials">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="pd-social-btn"><Icon size={16} /></a>
              ))}
            </div>
            <div className="pd-footer-contact">
              <p><Phone size={13} /> 042-34500888</p>
              <p><Mail size={13} /> support@physiodesk.com</p>
              <p><MapPin size={13} /> Lahore, Pakistan</p>
            </div>
          </div>

          {/* For Patients */}
          <div className="pd-footer-col">
            <h4>For Patients</h4>
            <Link to="/doctors">Find a Doctor</Link>
            <Link to="/pharmacy">Order Medicines</Link>
            <Link to="/patient/appointments">My Appointments</Link>
            <Link to="/patient/prescriptions">My Prescriptions</Link>
            <Link to="/patient/medical-records">Medical Records</Link>
            <Link to="/blogs">Health Blogs</Link>
            <Link to="/patient/complaints">File a Complaint</Link>
          </div>

          {/* For Doctors */}
          <div className="pd-footer-col">
            <h4>For Doctors</h4>
            <Link to="/register?role=doctor">Join as Doctor</Link>
            <Link to="/doctor/dashboard">Doctor Dashboard</Link>
            <Link to="/doctor/appointments">Appointments</Link>
            <Link to="/doctor/profile">Manage Profile</Link>
            <Link to="/doctor/blogs">Write Articles</Link>
          </div>

          {/* Company */}
          <div className="pd-footer-col">
            <h4>Company</h4>
            <Link to="/">About Us</Link>
            <Link to="/">Privacy Policy</Link>
            <Link to="/">Terms of Service</Link>
            <Link to="/">Contact Us</Link>
            <Link to="/">Careers</Link>
          </div>
        </div>

        <div className="pd-footer-bottom">
          <p>© {new Date().getFullYear()} PhysioDesk. All rights reserved. Developed as Final Year Project.</p>
          <p>Powered by Laravel + React</p>
        </div>
      </div>
    </footer>
  );
}
