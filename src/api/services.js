import { patientApi, doctorApi, adminApi, getApi } from './axios';

// ─────────────────────────────────────────────────────────────────────────────
//  PATIENT AUTH  —  always uses patientApi (pd_patient_token)
// ─────────────────────────────────────────────────────────────────────────────
export const patientAuthAPI = {
  register:       (data) => patientApi.post('/patient/auth/register', data),
  login:          (data) => patientApi.post('/patient/auth/login',    data),
  logout:         ()     => patientApi.post('/patient/auth/logout'),
  me:             ()     => patientApi.get('/patient/auth/me'),
  changePassword: (data) => patientApi.post('/patient/auth/change-password', data),
  forgotPassword: (data) => patientApi.post('/patient/auth/forgot-password', data),
  resetPassword:  (data) => patientApi.post('/patient/auth/reset-password', data),
  resendVerification: () => patientApi.post('/patient/auth/resend-verification'),
};

// ─────────────────────────────────────────────────────────────────────────────
//  DOCTOR AUTH  —  always uses doctorApi (pd_doctor_token)
// ─────────────────────────────────────────────────────────────────────────────
export const doctorAuthAPI = {
  register:       (data) => doctorApi.post('/doctor/auth/register', data),
  login:          (data) => doctorApi.post('/doctor/auth/login',    data),
  logout:         ()     => doctorApi.post('/doctor/auth/logout'),
  me:             ()     => doctorApi.get('/doctor/auth/me'),
  changePassword: (data) => doctorApi.post('/doctor/auth/change-password', data),
  forgotPassword: (data) => doctorApi.post('/doctor/auth/forgot-password', data),
  resetPassword:  (data) => doctorApi.post('/doctor/auth/reset-password', data),
  resendVerification: () => doctorApi.post('/doctor/auth/resend-verification'),
};

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN AUTH  —  always uses adminApi (pd_admin_token)
// ─────────────────────────────────────────────────────────────────────────────
export const adminAuthAPI = {
  login:          (data) => adminApi.post('/admin/auth/login',    data),
  logout:         ()     => adminApi.post('/admin/auth/logout'),
  me:             ()     => adminApi.get('/admin/auth/me'),
  changePassword: (data) => adminApi.post('/admin/auth/change-password', data),
  forgotPassword: (data) => adminApi.post('/admin/auth/forgot-password', data),
  resetPassword:  (data) => adminApi.post('/admin/auth/reset-password', data),
};

// Legacy shim — kept for any missed import during transition
export const authAPI = {
  logout: () => patientApi.post('/auth/logout'),
  me:     () => patientApi.get('/auth/me'),
};

// ─────────────────────────────────────────────────────────────────────────────
//  DOCTOR  (protected endpoints → doctorApi; public listings → getApi)
// ─────────────────────────────────────────────────────────────────────────────
export const doctorAPI = {
  getAll:          (params) => getApi().get('/doctors', { params }),
  getById:         (id)     => getApi().get(`/doctors/${id}`),
  getAvailability: (id, date) => getApi().get(`/doctors/${id}/availability`, { params: { date } }),
  getMyProfile:    ()       => doctorApi.get('/doctor/profile'),
  createProfile:   (data)   => doctorApi.post('/doctor/profile', data, {
                                 headers: { 'Content-Type': 'multipart/form-data' },
                               }),
  updateProfile:   (data)   => doctorApi.put('/doctor/profile', data),
  addTimeSlot:     (data)   => doctorApi.post('/doctor/time-slots', data),
  deleteTimeSlot:  (id)     => doctorApi.delete(`/doctor/time-slots/${id}`),
  getAppointments: ()       => doctorApi.get('/doctor/appointments'),
  confirmAppt:     (id)     => doctorApi.post(`/doctor/appointments/${id}/confirm`),
  completeAppt:    (id)     => doctorApi.post(`/doctor/appointments/${id}/complete`),
};

// ─────────────────────────────────────────────────────────────────────────────
//  PATIENT  (all protected endpoints → patientApi)
// ─────────────────────────────────────────────────────────────────────────────
export const patientAPI = {
  getMyProfile:           ()     => patientApi.get('/patient/profile'),
  myProfile:              ()     => patientApi.get('/patient/profile'),
  createProfile:          (data) => patientApi.post('/patient/profile', data, {
                                      headers: { 'Content-Type': 'multipart/form-data' },
                                    }),
  updateProfile:          (data) => patientApi.put('/patient/profile', data),
  updateProfileWithPhoto: (data) => patientApi.post('/patient/profile', data, {
                                      headers: { 'Content-Type': 'multipart/form-data' },
                                    }),
  myMedicalRecords: () => patientApi.get('/patient/medical-records'),
  myPrescriptions:  () => patientApi.get('/patient/prescriptions'),
  myAppointments:   () => patientApi.get('/patient/appointments'),
  myOrders:         () => patientApi.get('/patient/orders'),
  getOrderById:    (id) => patientApi.get(`/patient/orders/${id}`),
  myPayments:       () => patientApi.get('/patient/payments'),
};

// ─────────────────────────────────────────────────────────────────────────────
//  APPOINTMENTS  (patient books + cancels; getApi for shared reads)
// ─────────────────────────────────────────────────────────────────────────────
export const appointmentAPI = {
  myAppointments: ()           => patientApi.get('/patient/appointments'),
  book:           (data)       => patientApi.post('/appointments', data),
  getById:        (id)         => getApi().get(`/appointments/${id}`),
  cancel:         (id, data)   => patientApi.post(`/appointments/${id}/cancel`, data),
  reschedule:     (id, data)   => patientApi.post(`/appointments/${id}/reschedule`, data),
  addReview:      (id, data)   => patientApi.post(`/appointments/${id}/review`, data),
};

// ─────────────────────────────────────────────────────────────────────────────
//  PHARMACY  (patient only; public medicine listing → getApi, no token needed)
// ─────────────────────────────────────────────────────────────────────────────
export const pharmacyAPI = {
  getMedicines:          (params)   => getApi().get('/medicines', { params }),
  getMedicineById:       (id)       => getApi().get(`/medicines/${id}`),
  myOrders:              ()         => patientApi.get('/patient/orders'),
  placeOrder:            (data)     => patientApi.post('/orders', data),
  orderFromPrescription: (id, data) => patientApi.post(`/orders/from-prescription/${id}`, data),
  previewPrescription:   (id)       => patientApi.get(`/orders/prescription-preview/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
//  PAYMENTS  (patient only)
// ─────────────────────────────────────────────────────────────────────────────
export const paymentAPI = {
  initiateJazzCashAppointment: (id)       => patientApi.post(`/payments/jazzcash/appointment/${id}`),
  initiateJazzCashOrder:       (id)       => patientApi.post(`/payments/jazzcash/order/${id}`),
  payAppointment:              (id, data, config) => patientApi.post(`/payments/appointment/${id}`, data, config),
  payOrder:                    (id, data, config) => patientApi.post(`/payments/order/${id}`, data, config),
};

// ─────────────────────────────────────────────────────────────────────────────
//  PRESCRIPTIONS
//  Doctor writes → doctorApi.  Both doctor + patient read → getApi()
//  getApi() picks the right instance automatically from the current URL path:
//    /doctor/* → doctorApi,  /patient/* → patientApi,  /admin/* → adminApi
// ─────────────────────────────────────────────────────────────────────────────
export const prescriptionAPI = {
  getById:     (id)                  => getApi().get(`/prescriptions/${id}`),
  downloadPdf: (id)                  => getApi().get(`/prescriptions/${id}/download`, {
                                          responseType: 'blob',
                                        }),
  create:      (appointmentId, data) => doctorApi.post(
                                          `/appointments/${appointmentId}/prescriptions`, data
                                        ),
};

// ─────────────────────────────────────────────────────────────────────────────
//  MEDICAL RECORDS
//  Doctor creates → doctorApi.  Both doctor + patient read → getApi()
// ─────────────────────────────────────────────────────────────────────────────
export const medicalRecordAPI = {
  getById:      (id)        => getApi().get(`/medical-records/${id}`),
  getByPatient: (patientId) => getApi().get(`/medical-records/patient/${patientId}`),
  create:       (appointmentId, data) => doctorApi.post(
                                           `/appointments/${appointmentId}/medical-records`, data
                                         ),
};

// ─────────────────────────────────────────────────────────────────────────────
//  COMPLAINTS  (both doctor + patient can file; getApi picks correct token)
//  Only patient can delete → explicit patientApi
// ─────────────────────────────────────────────────────────────────────────────
export const complaintAPI = {
  list:   ()           => getApi().get('/complaints'),
  store:  (data)       => getApi().post('/complaints', data),
  update: (id, data)   => getApi().put(`/complaints/${id}`, data),
  delete: (id)         => patientApi.delete(`/complaints/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
//  BLOGS  (doctor manages → doctorApi; public + patient reads → getApi)
// ─────────────────────────────────────────────────────────────────────────────
export const blogAPI = {
  list:      (params)   => getApi().get('/blogs', { params }),
  getBySlug: (slug)     => getApi().get(`/blogs/${slug}`),
  myBlogs:   ()         => doctorApi.get('/blogs/my-blogs'),
  create:    (data)     => doctorApi.post('/blogs', data, {
                             headers: { 'Content-Type': 'multipart/form-data' },
                           }),
  update:    (id, data) => doctorApi.post(`/blogs/${id}`, data, {
                             headers: { 'Content-Type': 'multipart/form-data' },
                           }),
  delete:    (id)       => doctorApi.delete(`/blogs/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
//  REVIEWS  (patient writes → patientApi; public reads → getApi)
// ─────────────────────────────────────────────────────────────────────────────
export const reviewAPI = {
  getDoctorReviews: (doctorId)            => getApi().get(`/doctors/${doctorId}/reviews`),
  create:           (appointmentId, data) => patientApi.post(
                                               `/appointments/${appointmentId}/review`, data
                                             ),
};

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN  (all endpoints → adminApi, always)
// ─────────────────────────────────────────────────────────────────────────────
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
  getOrders:         ()         => adminApi.get('/admin/orders'),
  updateOrderStatus: (id, data) => adminApi.put(`/admin/orders/${id}/status`, data),
  getTransactions:   ()         => adminApi.get('/admin/transactions'),
  confirmCodPayment: (id)       => adminApi.post(`/admin/payments/${id}/confirm-cod`),
  // Newly wired admin actions
  confirmPayment:    (id)       => adminApi.post(`/admin/payments/${id}/confirm`),
  refundPayment:     (id, data) => adminApi.post(`/admin/payments/${id}/refund`, data),
  getDoctorDocument: (id, type) => adminApi.get(`/admin/doctors/${id}/document/${type}`, { responseType: 'blob' }),
};
