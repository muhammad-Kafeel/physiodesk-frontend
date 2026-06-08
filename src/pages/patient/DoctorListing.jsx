import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Star, MapPin, Video, Clock, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { doctorAPI } from '../../api/services';
import './DoctorListing.css';

const SPECS = ['All','Physiotherapist','Orthopedic Surgeon','Neurologist','Sports Medicine','Rheumatologist','Chiropractor','Pain Specialist'];
const FEES  = [{ label:'Any Fee', min:0, max:99999 },{ label:'Under Rs.500', min:0, max:500 },{ label:'Rs.500â€“1000', min:500, max:1000 },{ label:'Rs.1000â€“2000', min:1000, max:2000 },{ label:'Over Rs.2000', min:2000, max:99999 }];
const GENDERS = ['Any','Male','Female'];

export default function DoctorListing() {
  const [params]               = useSearchParams();
  const [doctors,   setDoctors]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [spec,      setSpec]      = useState(params.get('spec') || 'All');
  const [feeIdx,    setFeeIdx]    = useState(0);
  const [gender,    setGender]    = useState('Any');
  const [sort,      setSort]      = useState('rating');
  const [filterOpen,setFilterOpen]= useState(false);
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await doctorAPI.getAll({
          specialization: spec !== 'All' ? spec : undefined,
          min_fee: FEES[feeIdx].min || undefined,
          max_fee: FEES[feeIdx].max < 99999 ? FEES[feeIdx].max : undefined,
          gender:  gender !== 'Any' ? gender.toLowerCase() : undefined,
          sort,
          page,
          q: params.get('q') || undefined,
        });
        setDoctors(res.data.data.data || []);
        setTotal(res.data.data.total || 0);
      } catch { setDoctors([]); }
      finally  { setLoading(false); }
    };
    fetch();
  }, [spec, feeIdx, gender, sort, page, params.get('q')]);

  const activeFilters = [
    spec !== 'All'  && { label: spec,              clear: () => setSpec('All') },
    feeIdx !== 0    && { label: FEES[feeIdx].label, clear: () => setFeeIdx(0) },
    gender !== 'Any'&& { label: gender,             clear: () => setGender('Any') },
  ].filter(Boolean);

  return (
    <Layout>
      <div className="pd-container pd-section">

        {/* Header row */}
        <div className="dl-top-row">
          <div>
            <h1 className="dl-title">
              {params.get('q') ? `Results for "${params.get('q')}"` : 'Find a Physiotherapist'}
            </h1>
            <p className="dl-sub">{loading ? '...' : `${total} doctors available`}</p>
          </div>
          <div className="dl-controls">
            <select className="dl-sort" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="rating">Top Rated</option>
              <option value="fee_asc">Fee: Low to High</option>
              <option value="fee_desc">Fee: High to Low</option>
              <option value="experience">Most Experienced</option>
            </select>
            <button className="dl-filter-btn" onClick={() => setFilterOpen(p => !p)}>
              <SlidersHorizontal size={15} /> Filters
              {activeFilters.length > 0 && <span className="dl-filter-badge">{activeFilters.length}</span>}
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="dl-chips">
            {activeFilters.map((f, i) => (
              <button key={i} className="dl-chip" onClick={f.clear}>
                {f.label} <X size={12} />
              </button>
            ))}
            <button className="dl-chip dl-chip-clear"
              onClick={() => { setSpec('All'); setFeeIdx(0); setGender('Any'); }}>
              Clear all
            </button>
          </div>
        )}

        <div className="dl-layout">
          {/* Sidebar filters */}
          <aside className={`dl-sidebar ${filterOpen ? 'open' : ''}`}>
            <div className="dl-sidebar-header">
              <p className="dl-sidebar-title">Filters</p>
              <button className="dl-sidebar-close" onClick={() => setFilterOpen(false)}><X size={18} /></button>
            </div>

            {/* Specialty */}
            <div className="dl-filter-group">
              <p className="dl-filter-label">Specialty</p>
              {SPECS.map(s => (
                <label key={s} className={`dl-filter-opt ${spec === s ? 'active' : ''}`}>
                  <input type="radio" name="spec" checked={spec === s}
                    onChange={() => { setSpec(s); setPage(1); }} />
                  {s}
                </label>
              ))}
            </div>

            {/* Fee */}
            <div className="dl-filter-group">
              <p className="dl-filter-label">Consultation Fee</p>
              {FEES.map((f, i) => (
                <label key={i} className={`dl-filter-opt ${feeIdx === i ? 'active' : ''}`}>
                  <input type="radio" name="fee" checked={feeIdx === i}
                    onChange={() => { setFeeIdx(i); setPage(1); }} />
                  {f.label}
                </label>
              ))}
            </div>

            {/* Gender */}
            <div className="dl-filter-group">
              <p className="dl-filter-label">Doctor Gender</p>
              {GENDERS.map(g => (
                <label key={g} className={`dl-filter-opt ${gender === g ? 'active' : ''}`}>
                  <input type="radio" name="gender" checked={gender === g}
                    onChange={() => { setGender(g); setPage(1); }} />
                  {g}
                </label>
              ))}
            </div>
          </aside>

          {/* Spec pills */}
          <div className="dl-main">
            <div className="dl-spec-pills">
              {SPECS.map(s => (
                <button key={s}
                  className={`dl-spec-pill ${spec === s ? 'active' : ''}`}
                  onClick={() => { setSpec(s); setPage(1); }}>
                  {s}
                </button>
              ))}
            </div>

            {/* Doctor cards */}
            {loading ? (
              <div className="dl-loading">
                {[1,2,3,4].map(i => <div key={i} className="dl-skeleton" />)}
              </div>
            ) : doctors.length === 0 ? (
              <div className="pd-empty">
                <p style={{fontSize:48}}>ðŸ‘¨â€âš•ï¸</p>
                <p>No doctors found. Try different filters.</p>
              </div>
            ) : (
              <div className="dl-cards">
                {doctors.map(doc => <DoctorCard key={doc.id} doc={doc} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function DoctorCard({ doc }) {
  const user = doc.user || {};
  return (
    <div className="dc-card">
      <div className="dc-card-inner">
        {/* Photo */}
        <div className="dc-photo-wrap">
          {doc.profile_photo
            ? <img src={`http://localhost:8000/storage/${doc.profile_photo}`} alt={user.name} className="dc-photo" />
            : <div className="dc-photo-placeholder">{user.name?.[0] || 'D'}</div>
          }
          {doc.is_available && <span className="dc-available">Available</span>}
        </div>

        {/* Info */}
        <div className="dc-info">
          <div className="dc-name-row">
            <h3 className="dc-name">Dr. {user.name}</h3>
            {doc.is_verified && <span className="dc-verified">âœ“ Verified</span>}
          </div>
          <p className="dc-spec">{doc.specialization}</p>
          <p className="dc-qual">{doc.qualification}</p>

          <div className="dc-meta">
            <span className="dc-meta-item">
              <Star size={12} fill="#F5960B" color="#F5960B" />
              {doc.rating || '0.0'} ({doc.total_reviews || 0} reviews)
            </span>
            <span className="dc-meta-item">
              <Clock size={12} /> {doc.experience_years} yrs exp
            </span>
            {doc.city && (
              <span className="dc-meta-item">
                <MapPin size={12} /> {doc.city}
              </span>
            )}
          </div>

          <div className="dc-modes">
            <span className="dc-mode"><Video size={12} /> Video</span>
          </div>
        </div>

        {/* Right â€” fee + action */}
        <div className="dc-action">
          <p className="dc-fee-label">Consultation Fee</p>
          <p className="dc-fee">Rs. {Number(doc.consultation_fee).toLocaleString()}</p>
          <Link to={`/doctors/${doc.id}`} className="dc-view-btn">
            View Profile <ChevronRight size={14} />
          </Link>
          <Link to={`/book/${doc.id}`} className="dc-book-btn">
            Book Appointment
          </Link>
        </div>
      </div>
    </div>
  );
}

