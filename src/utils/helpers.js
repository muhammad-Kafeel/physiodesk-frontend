// F20 — Central helper so backend storage URLs are never hardcoded in components.
// All image/file src attributes should use storageUrl() instead of building
// the URL manually with http://localhost:8000.
export const storageUrl = (path) => {
  if (!path) return null;
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api')
    .replace(/\/api\/?$/, '');
  return `${base}/storage/${path}`;
};

export const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

export const formatDateTime = (date) =>
  date ? new Date(date).toLocaleString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

export const formatCurrency = (amount) =>
  amount != null ? `PKR ${Number(amount).toLocaleString()}` : '-';

export const getStatusBadge = (status) => {
  const map = {
    pending:      'warning',
    confirmed:    'info',
    completed:    'success',
    cancelled:    'danger',
    rescheduled:  'secondary',
    processing:   'primary',
    dispatched:   'info',
    delivered:    'success',
    published:    'success',
    draft:        'secondary',
    resolved:     'success',
    dismissed:    'secondary',
    under_review: 'warning',
    paid:         'success',
    unpaid:       'danger',
    refunded:     'warning',
  };
  return map[status] || 'secondary';
};

export const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Something went wrong';

export const truncate = (str, n = 100) =>
  str && str.length > n ? str.slice(0, n) + '...' : str;
