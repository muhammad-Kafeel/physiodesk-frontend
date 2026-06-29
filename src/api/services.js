import { patientApi, doctorApi, adminApi, getApi } from './axios';

export const patientAuthAPI = {
  sendOtp:            (data) => patientApi.post('/patient/auth/send-otp', data),
  verifyOtp:          (data) => patientApi.post('/patient/auth/verify-otp', data),
  register:           (data) => patientApi.post('/patient/auth/register', data),
  login:              (data) => patientApi.post('/patient/auth/login',    data),
  logout:             ()     => patientApi.post('/patient/auth/logout'),
  me:                 ()     => patientApi.get('/patient/auth/me'),
  changePassword:     (data) => patientApi.post('/patient/auth/change-password', data),
  forgotPassword:     (data) => patientApi.post('/patient/auth/forgot-password', data),
  verifyResetOtp:     (data) => patientApi.post('/patient/auth/verify-reset-otp', data),
  resetPassword:      (data) => patientApi.post('/patient/auth/reset-password', data),
  resendVerification: ()     => patientApi.post('/patient/auth/resend-verification'),
};

export const doctorAuthAPI = {
  sendOtp:            (data) => doctorApi.post('/doctor/auth/send-otp', data),
  verifyOtp:          (data) => doctorApi.post('/doctor/auth/verify-otp', data),
  register:           (data) => doctorApi.post('/doctor/auth/register', data),
  login:              (data) => doctorApi.post('/doctor/auth/login',    data),
  logout:             ()     => doctorApi.post('/doctor/auth/logout'),
  me:                 ()     => doctorApi.get('/doctor/auth/me'),
  changePassword:     (data) => doctorApi.post('/doctor/auth/change-password', data),
  forgotPassword:     (data) => doctorApi.post('/doctor/auth/forgot-password', data),
  verifyResetOtp:     (data) => doctorApi.post('/doctor/auth/verify-reset-otp', data),
  resetPassword:      (data) => doctorApi.post('/doctor/auth/reset-password', data),
  resendVerification: ()     => doctorApi.post('/doctor/auth/resend-verification'),
};

export const adminAuthAPI = {
  login:              (data) => adminApi.post('/admin/auth/login',    data),
  logout:             ()     => adminApi.post('/admin/auth/logout'),
  me:                 ()     => adminApi.get('/admin/auth/me'),
  changePassword:     (data) => adminApi.post('/admin/auth/change-password', data),
  forgotPassword:     (data) => adminApi.post('/admin/auth/forgot-password', data),
  verifyResetOtp:     (data) => adminApi.post('/admin/auth/verify-reset-otp', data),
  resetPassword:      (data) => adminApi.post('/admin/auth/reset-password', data),
  resendVerification: ()     => adminApi.post('/admin/auth/resend-verification'),
};

export const authAPI = {
  logout: () => patientApi.post('/auth/logout'),
  me:     () => patientApi.get('/auth/me'),
};

// ─────────────────────────────────────────────────────────────────────────────
//  GUEST — no auth required
//  Supports COD, JazzCash, and Bank Transfer.
// ─────────────────────────────────────────────────────────────────────────────
export const guestAPI = {
  placeOrder:       (data)        => getApi().post('/guest/orders', data),
  trackOrder:       (params)      => getApi().get('/guest/orders/track', { params }),
  initiateJazzCash: (orderNumber) => getApi().post(`/guest/orders/${orderNumber}/pay/jazzcash`),
};

export const doctorAPI = {
  getAll:          (params)   => getApi().get('/doctors', { params }),
  getById:         (id)       => getApi().get(`/doctors/${id}`),
  getAvailability: (id, date) => getApi().get(`/doctors/${id}/availability`, { params: { date } }),
  getMyProfile:    ()         => doctorApi.get('/doctor/profile'),
  createProfile:   (data)     => doctorApi.post('/doctor/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  // Updates also use POST (to /doctor/profile/update) because multipart uploads
  // on PUT are not reliably parsed by PHP/Laravel. Same method on the controller.
  updateProfile:   (data)     => doctorApi.post('/doctor/profile/update', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  addTimeSlot:     (data)     => doctorApi.post('/doctor/time-slots', data),
  deleteTimeSlot:  (id)       => doctorApi.delete(`/doctor/time-slots/${id}`),
  // H2.#9 — Slot UX helpers
  copyTimeSlots:   (data)     => doctorApi.post('/doctor/time-slots/copy', data),
  clearDayTimeSlots: (data)   => doctorApi.post('/doctor/time-slots/clear-day', data),
  // H2.#10 — Leave management
  listUnavailableDates: ()    => doctorApi.get('/doctor/unavailable-dates'),
  addUnavailableDate: (data)  => doctorApi.post('/doctor/unavailable-dates', data),
  deleteUnavailableDate: (id) => doctorApi.delete(`/doctor/unavailable-dates/${id}`),
  // H2.#13 — Resubmit verification
  resubmitVerification: ()    => doctorApi.post('/doctor/resubmit-verification'),
  getAppointments: ()         => doctorApi.get('/doctor/appointments'),
  confirmAppt:     (id)       => doctorApi.post(`/doctor/appointments/${id}/confirm`),
  completeAppt:    (id)       => doctorApi.post(`/doctor/appointments/${id}/complete`),
  patientHistory:  (patientId) => doctorApi.get(`/doctor/patients/${patientId}/history`),
};

export const patientAPI = {
  getMyProfile:           ()     => patientApi.get('/patient/profile'),
  myProfile:              ()     => patientApi.get('/patient/profile'),
  createProfile:          (data) => patientApi.post('/patient/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateProfile:          (data) => patientApi.put('/patient/profile', data),
  updateProfileWithPhoto: (data) => patientApi.post('/patient/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  myMedicalRecords: () => patientApi.get('/patient/medical-records'),
  myPrescriptions:  () => patientApi.get('/patient/prescriptions'),
  myAppointments:   () => patientApi.get('/patient/appointments'),
  myOrders:         () => patientApi.get('/patient/orders'),
  getOrderById:    (id) => patientApi.get(`/patient/orders/${id}`),
  myPayments:       () => patientApi.get('/patient/payments'),
};

export const appointmentAPI = {
  myAppointments: ()         => patientApi.get('/patient/appointments'),
  book:           (data)     => patientApi.post('/appointments', data),
  getById:        (id)       => getApi().get(`/appointments/${id}`),
  cancel:         (id, data) => patientApi.post(`/appointments/${id}/cancel`, data),
  reschedule:     (id, data) => patientApi.post(`/appointments/${id}/reschedule`, data),
  addReview:      (id, data) => patientApi.post(`/appointments/${id}/review`, data),
};

export const pharmacyAPI = {
  getMedicines:          (params)   => getApi().get('/medicines', { params }),
  getMedicineById:       (id)       => getApi().get(`/medicines/${id}`),
  myOrders:              ()         => patientApi.get('/patient/orders'),
  placeOrder:            (data)     => patientApi.post('/orders', data),
  orderFromPrescription: (id, data) => patientApi.post(`/orders/from-prescription/${id}`, data),
  previewPrescription:   (id)       => patientApi.get(`/orders/prescription-preview/${id}`),
  cancelOrder:           (id, data) => patientApi.post(`/patient/orders/${id}/cancel`, data),
};

export const paymentAPI = {
  initiateJazzCashAppointment: (id)          => patientApi.post(`/payments/jazzcash/appointment/${id}`),
  initiateJazzCashOrder:       (id)          => patientApi.post(`/payments/jazzcash/order/${id}`),
  payAppointment:              (id, data, c) => patientApi.post(`/payments/appointment/${id}`, data, c),
  payOrder:                    (id, data, c) => patientApi.post(`/payments/order/${id}`, data, c),
};

export const prescriptionAPI = {
  getById:     (id)              => getApi().get(`/prescriptions/${id}`),
  downloadPdf: (id)              => getApi().get(`/prescriptions/${id}/download`, { responseType: 'blob' }),
  create:      (appointmentId, data) => doctorApi.post(`/appointments/${appointmentId}/prescriptions`, data),
  update:      (id, data)        => doctorApi.put(`/prescriptions/${id}`, data),
};

export const medicalRecordAPI = {
  getById:      (id)        => getApi().get(`/medical-records/${id}`),
  getByPatient: (patientId) => getApi().get(`/medical-records/patient/${patientId}`),
  create:       (appointmentId, data) => doctorApi.post(`/appointments/${appointmentId}/medical-records`, data),
};

export const complaintAPI = {
  list:   ()         => getApi().get('/complaints'),
  store:  (data)     => getApi().post('/complaints', data),
  update: (id, data) => getApi().put(`/complaints/${id}`, data),
  delete: (id)       => getApi().delete(`/complaints/${id}`),
};

export const blogAPI = {
  list:      (params)   => getApi().get('/blogs', { params }),
  getBySlug: (slug)     => getApi().get(`/blogs/${slug}`),
  myBlogs:   ()         => doctorApi.get('/blogs/my-blogs'),
  create:    (data)     => doctorApi.post('/blogs', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:    (id, data) => doctorApi.post(`/blogs/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:    (id)       => doctorApi.delete(`/blogs/${id}`),
};

export const reviewAPI = {
  getDoctorReviews: (doctorId)            => getApi().get(`/doctors/${doctorId}/reviews`),
  create:           (appointmentId, data) => patientApi.post(`/appointments/${appointmentId}/review`, data),
};

// ────────────────────────────────────────────────────────────────────────
//  NOTIFICATIONS — H4
//
//  Same set of endpoints for every role; getApi() picks the right axios
//  instance (and therefore the right token) based on the current URL. The
//  unreadCount call is the hot one — hit every 30 seconds while the tab is
//  visible — so it's kept payload-tiny on the backend.
// ────────────────────────────────────────────────────────────────────────
export const notificationAPI = {
  list:        ()    => getApi().get('/notifications'),
  unreadCount: ()    => getApi().get('/notifications/unread-count'),
  markRead:    (id)  => getApi().post(`/notifications/${id}/read`),
  markAllRead: ()    => getApi().post('/notifications/read-all'),
};

export const adminAPI = {
  getDashboard:      ()         => adminApi.get('/admin/dashboard'),
  getUsers:          (params)   => adminApi.get('/admin/users', { params }),
  toggleUserStatus:  (id)       => adminApi.put(`/admin/users/${id}/toggle-status`),
  deleteUser:        (id)       => adminApi.delete(`/admin/users/${id}`),
  verifyDoctor:      (id)       => adminApi.post(`/admin/doctors/${id}/verify`),
  rejectDoctor:      (id, data) => adminApi.post(`/admin/doctors/${id}/reject`, data),
  getComplaints:     (params)   => adminApi.get('/admin/complaints', { params }),
  resolveComplaint:  (id, data) => adminApi.put(`/admin/complaints/${id}/resolve`, data),
  getMedicines:      ()         => adminApi.get('/admin/medicines'),
  createMedicine:    (data)     => adminApi.post('/admin/medicines', data),
  updateMedicine:    (id, data) => adminApi.put(`/admin/medicines/${id}`, data),
  getOrders:         (params)   => adminApi.get('/admin/orders', { params }),
  updateOrderStatus: (id, data) => adminApi.put(`/admin/orders/${id}/status`, data),
  getTransactions:   ()         => adminApi.get('/admin/transactions'),
  confirmCodPayment: (id)       => adminApi.post(`/admin/payments/${id}/confirm-cod`),
  confirmPayment:    (id)       => adminApi.post(`/admin/payments/${id}/confirm`),
  refundPayment:     (id, data) => adminApi.post(`/admin/payments/${id}/refund`, data),
  getDoctorDocument: (id, type) => adminApi.get(`/admin/doctors/${id}/document/${type}`, { responseType: 'blob' }),
};
