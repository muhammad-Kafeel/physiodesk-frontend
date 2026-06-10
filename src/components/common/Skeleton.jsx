import './Skeleton.css';

// Generic shimmer skeleton block
export function SkeletonBlock({ width = '100%', height = 16, radius = 8, style = {} }) {
  return (
    <div className="skel-block" style={{ width, height, borderRadius: radius, ...style }} />
  );
}

// Doctor card skeleton
export function DoctorCardSkeleton() {
  return (
    <div className="skel-doctor-card">
      <div className="skel-doctor-inner">
        <SkeletonBlock width={80} height={80} radius={50} />
        <div className="skel-doctor-info">
          <SkeletonBlock width="60%" height={18} style={{ marginBottom: 8 }} />
          <SkeletonBlock width="40%" height={14} style={{ marginBottom: 8 }} />
          <SkeletonBlock width="80%" height={12} style={{ marginBottom: 6 }} />
          <SkeletonBlock width="50%" height={12} />
        </div>
        <div className="skel-doctor-action">
          <SkeletonBlock width={80} height={20} style={{ marginBottom: 12 }} />
          <SkeletonBlock width={120} height={36} radius={8} style={{ marginBottom: 8 }} />
          <SkeletonBlock width={120} height={36} radius={8} />
        </div>
      </div>
    </div>
  );
}

// Blog card skeleton
export function BlogCardSkeleton() {
  return (
    <div className="skel-blog-card">
      <SkeletonBlock width="100%" height={160} radius={12} style={{ marginBottom: 14 }} />
      <SkeletonBlock width="40%" height={12} style={{ marginBottom: 8 }} />
      <SkeletonBlock width="90%" height={18} style={{ marginBottom: 8 }} />
      <SkeletonBlock width="100%" height={12} style={{ marginBottom: 6 }} />
      <SkeletonBlock width="70%" height={12} />
    </div>
  );
}

// Appointment card skeleton
export function AppointmentCardSkeleton() {
  return (
    <div className="skel-appt-card">
      <SkeletonBlock width={44} height={44} radius={50} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <SkeletonBlock width="50%" height={16} style={{ marginBottom: 8 }} />
        <SkeletonBlock width="35%" height={12} style={{ marginBottom: 8 }} />
        <SkeletonBlock width="60%" height={12} />
      </div>
      <div>
        <SkeletonBlock width={80} height={24} radius={99} style={{ marginBottom: 8 }} />
        <SkeletonBlock width={80} height={32} radius={8} />
      </div>
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '12px 14px' }}>
          <SkeletonBlock width={i === 0 ? '80%' : '60%'} height={14} />
        </td>
      ))}
    </tr>
  );
}

// Generic list skeleton — n items
export function ListSkeleton({ count = 4, type = 'appt' }) {
  const Component = type === 'doctor' ? DoctorCardSkeleton
    : type === 'blog' ? BlogCardSkeleton
    : AppointmentCardSkeleton;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => <Component key={i} />)}
    </>
  );
}
