import api from './axios';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:       (data) => api.post('/auth/register', data),
  login:          (data) => api.post('/auth/login', data),
  logout:         ()     => api.post('/auth/logout'),
  me:             ()     => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// ── Doctor ────────────────────────────────────────────────────────────────────
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
  confirmAppt:     (id)     => api.post(`/doctor/appointments/${id}/confirm`),  // ✅ correct
  completeAppt:    (id)     => api.post(`/doctor/appointments/${id}/complete`), // ✅ correct
};

// ── Patient ───────────────────────────────────────────────────────────────────
export const patientAPI = {
  getMyProfile:    ()     => api.get('/patient/profile'),
  myProfile:       ()     => api.get('/patient/profile'),
  createProfile:   (data) => api.post('/patient/profile', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateProfile:   (data) => api.put('/patient/profile', data),
  updateProfileWithPhoto: (data) => api.post('/patient/profile', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  myMedicalRecords: ()    => api.get('/patient/medical-records'),
  myPrescriptions:  ()    => api.get('/patient/prescriptions'),
  myAppointments:   ()    => api.get('/patient/appointments'),
  myOrders:         ()    => api.get('/patient/orders'),
  getOrderById:     (id)  => api.get(`/patient/orders/${id}`),
  myPayments:       ()    => api.get('/patient/payments'),
};

// ── Appointments ──────────────────────────────────────────────────────────────
export const appointmentAPI = {
  myAppointments: ()           => api.get('/patient/appointments'),
  book:           (data)       => api.post('/appointments', data),
  getById:        (id)         => api.get(`/appointments/${id}`),
  cancel:         (id, data)   => api.post(`/appointments/${id}/cancel`, data),
  reschedule:     (id, data)   => api.post(`/appointments/${id}/reschedule`, data),
  addReview:      (id, data)   => api.post(`/appointments/${id}/review`, data),
};

// ── Pharmacy ──────────────────────────────────────────────────────────────────
export const pharmacyAPI = {
  getMedicines:          (params)   => api.get('/medicines', { params }),
  getMedicineById:       (id)       => api.get(`/medicines/${id}`),
  myOrders:              ()         => api.get('/patient/orders'),
  placeOrder:            (data)     => api.post('/orders', data),
  orderFromPrescription: (id, data) => api.post(`/orders/from-prescription/${id}`, data),
  previewPrescription:   (id)       => api.get(`/orders/prescription-preview/${id}`),
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentAPI = {
  payAppointment: (id, data) => api.post(`/payments/appointment/${id}`, data),
  payOrder:       (id, data) => api.post(`/payments/order/${id}`, data),
};

// ── Prescriptions ─────────────────────────────────────────────────────────────
export const prescriptionAPI = {
  getById:     (id)                  => api.get(`/prescriptions/${id}`),
  downloadPdf: (id)                  => api.get(`/prescriptions/${id}/download`, { responseType: 'blob' }),
  create:      (appointmentId, data) => api.post(`/appointments/${appointmentId}/prescriptions`, data),
};

// ── Medical Records ───────────────────────────────────────────────────────────
export const medicalRecordAPI = {
  getById:      (id)          => api.get(`/medical-records/${id}`),
  getByPatient: (patientId)   => api.get(`/medical-records/patient/${patientId}`),
  create:       (appointmentId, data) => api.post(`/appointments/${appointmentId}/medical-records`, data),
};

// ── Complaints ────────────────────────────────────────────────────────────────
export const complaintAPI = {
  list:   ()           => api.get('/complaints'),
  store:  (data)       => api.post('/complaints', data),
  update: (id, data)   => api.put(`/complaints/${id}`, data),
  delete: (id)         => api.delete(`/complaints/${id}`),
};

// ── Blogs ─────────────────────────────────────────────────────────────────────
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

// ── Reviews ───────────────────────────────────────────────────────────────────
export const reviewAPI = {
  getDoctorReviews: (doctorId)            => api.get(`/doctors/${doctorId}/reviews`),
  create:           (appointmentId, data) => api.post(`/appointments/${appointmentId}/review`, data),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
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
