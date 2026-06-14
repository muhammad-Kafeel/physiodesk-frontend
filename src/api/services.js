import api from './axios';

// ─────────────────────────────────────────────────────────────────────────────
//  PATIENT AUTH  —  /api/patient/auth/...
//  Completely isolated from doctor / admin auth.
//  Same email can be registered independently on doctor side.
// ─────────────────────────────────────────────────────────────────────────────
export const patientAuthAPI = {
  register:       (data) => api.post('/patient/auth/register', data),
  login:          (data) => api.post('/patient/auth/login',    data),
  logout:         ()     => api.post('/patient/auth/logout'),
  me:             ()     => api.get('/patient/auth/me'),
  changePassword: (data) => api.post('/patient/auth/change-password', data),
};

// ─────────────────────────────────────────────────────────────────────────────
//  DOCTOR AUTH  —  /api/doctor/auth/...
// ─────────────────────────────────────────────────────────────────────────────
export const doctorAuthAPI = {
  register:       (data) => api.post('/doctor/auth/register', data),
  login:          (data) => api.post('/doctor/auth/login',    data),
  logout:         ()     => api.post('/doctor/auth/logout'),
  me:             ()     => api.get('/doctor/auth/me'),
  changePassword: (data) => api.post('/doctor/auth/change-password', data),
};

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN AUTH  —  /api/admin/auth/...
//  No public register endpoint.
// ─────────────────────────────────────────────────────────────────────────────
export const adminAuthAPI = {
  login:          (data) => api.post('/admin/auth/login',    data),
  logout:         ()     => api.post('/admin/auth/logout'),
  me:             ()     => api.get('/admin/auth/me'),
  changePassword: (data) => api.post('/admin/auth/change-password', data),
};

// ─────────────────────────────────────────────────────────────────────────────
//  LEGACY  (kept briefly during token transition — will be removed)
// ─────────────────────────────────────────────────────────────────────────────
export const authAPI = {
  logout: () => api.post('/auth/logout'),
  me:     () => api.get('/auth/me'),
};

// ─────────────────────────────────────────────────────────────────────────────
//  DOCTOR  (profile, schedule, appointments)
// ─────────────────────────────────────────────────────────────────────────────
export const doctorAPI = {
  getAll:          (params) => api.get('/doctors', { params }),
  getById:         (id)     => api.get(`/doctors/${id}`),
  getMyProfile:    ()       => api.get('/doctor/profile'),
  createProfile:   (data)   => api.post('/doctor/profile', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateProfile:   (data)   => api.post('/doctor/profile', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  addTimeSlot:     (data)   => api.post('/doctor/time-slots', data),
  deleteTimeSlot:  (id)     => api.delete(`/doctor/time-slots/${id}`),
  getAppointments: ()       => api.get('/doctor/appointments'),
  confirmAppt:     (id)     => api.post(`/doctor/appointments/${id}/confirm`),
  completeAppt:    (id)     => api.post(`/doctor/appointments/${id}/complete`),
};

// ─────────────────────────────────────────────────────────────────────────────
//  PATIENT  (profile, records, prescriptions)
// ─────────────────────────────────────────────────────────────────────────────
export const patientAPI = {
  getMyProfile:           ()     => api.get('/patient/profile'),
  myProfile:              ()     => api.get('/patient/profile'),
  createProfile:          (data) => api.post('/patient/profile', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateProfile:          (data) => api.put('/patient/profile', data),
  updateProfileWithPhoto: (data) => api.post('/patient/profile', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  myMedicalRecords: () => api.get('/patient/medical-records'),
  myPrescriptions:  () => api.get('/patient/prescriptions'),
  myAppointments:   () => api.get('/patient/appointments'),
  myOrders:         () => api.get('/patient/orders'),
  getOrderById:     (id) => api.get(`/patient/orders/${id}`),
  myPayments:       () => api.get('/patient/payments'),
};

// ─────────────────────────────────────────────────────────────────────────────
//  APPOINTMENTS
// ─────────────────────────────────────────────────────────────────────────────
export const appointmentAPI = {
  myAppointments: ()           => api.get('/patient/appointments'),
  book:           (data)       => api.post('/appointments', data),
  getById:        (id)         => api.get(`/appointments/${id}`),
  cancel:         (id, data)   => api.post(`/appointments/${id}/cancel`, data),
  reschedule:     (id, data)   => api.post(`/appointments/${id}/reschedule`, data),
  addReview:      (id, data)   => api.post(`/appointments/${id}/review`, data),
};

// ─────────────────────────────────────────────────────────────────────────────
//  PHARMACY
// ─────────────────────────────────────────────────────────────────────────────
export const pharmacyAPI = {
  getMedicines:          (params)   => api.get('/medicines', { params }),
  getMedicineById:       (id)       => api.get(`/medicines/${id}`),
  myOrders:              ()         => api.get('/patient/orders'),
  placeOrder:            (data)     => api.post('/orders', data),
  orderFromPrescription: (id, data) => api.post(`/orders/from-prescription/${id}`, data),
  previewPrescription:   (id)       => api.get(`/orders/prescription-preview/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
//  PAYMENTS
// ─────────────────────────────────────────────────────────────────────────────
export const paymentAPI = {
  payAppointment: (id, data) => api.post(`/payments/appointment/${id}`, data),
  payOrder:       (id, data) => api.post(`/payments/order/${id}`, data),
};

// ─────────────────────────────────────────────────────────────────────────────
//  PRESCRIPTIONS
// ─────────────────────────────────────────────────────────────────────────────
export const prescriptionAPI = {
  getById:     (id)                  => api.get(`/prescriptions/${id}`),
  downloadPdf: (id)                  => api.get(`/prescriptions/${id}/download`, { responseType: 'blob' }),
  create:      (appointmentId, data) => api.post(`/appointments/${appointmentId}/prescriptions`, data),
};

// ─────────────────────────────────────────────────────────────────────────────
//  MEDICAL RECORDS
// ─────────────────────────────────────────────────────────────────────────────
export const medicalRecordAPI = {
  getById:      (id)        => api.get(`/medical-records/${id}`),
  getByPatient: (patientId) => api.get(`/medical-records/patient/${patientId}`),
  create:       (appointmentId, data) => api.post(`/appointments/${appointmentId}/medical-records`, data),
};

// ─────────────────────────────────────────────────────────────────────────────
//  COMPLAINTS
// ─────────────────────────────────────────────────────────────────────────────
export const complaintAPI = {
  list:   ()           => api.get('/complaints'),
  store:  (data)       => api.post('/complaints', data),
  update: (id, data)   => api.put(`/complaints/${id}`, data),
  delete: (id)         => api.delete(`/complaints/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
//  BLOGS
// ─────────────────────────────────────────────────────────────────────────────
export const blogAPI = {
  list:      (params)   => api.get('/blogs', { params }),
  getBySlug: (slug)     => api.get(`/blogs/${slug}`),
  myBlogs:   ()         => api.get('/blogs/my-blogs'),
  create:    (data)     => api.post('/blogs', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update:    (id, data) => api.post(`/blogs/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete:    (id)       => api.delete(`/blogs/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
//  REVIEWS
// ─────────────────────────────────────────────────────────────────────────────
export const reviewAPI = {
  getDoctorReviews: (doctorId)            => api.get(`/doctors/${doctorId}/reviews`),
  create:           (appointmentId, data) => api.post(`/appointments/${appointmentId}/review`, data),
};

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN
// ─────────────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard:      ()         => api.get('/admin/dashboard'),
  getUsers:          (params)   => api.get('/admin/users', { params }),
  toggleUserStatus:  (id)       => api.put(`/admin/users/${id}/toggle-status`),
  deleteUser:        (id)       => api.delete(`/admin/users/${id}`),
  verifyDoctor:      (id)       => api.post(`/admin/doctors/${id}/verify`),
  rejectDoctor:      (id, data) => api.post(`/admin/doctors/${id}/reject`, data),
  getComplaints:     (params)   => api.get('/admin/complaints', { params }),
  resolveComplaint:  (id, data) => api.put(`/admin/complaints/${id}/resolve`, data),
  getMedicines:      ()         => api.get('/admin/medicines'),
  createMedicine:    (data)     => api.post('/admin/medicines', data),
  updateMedicine:    (id, data) => api.put(`/admin/medicines/${id}`, data),
  getOrders:         ()         => api.get('/admin/orders'),
  updateOrderStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
  getTransactions:   ()         => api.get('/admin/transactions'),
};
