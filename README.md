# ⚛️ PhysioDesk Frontend — Virtual Physiotherapy Clinic

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-7-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white)

> **Final Year Project** — Frontend for PhysioDesk, a virtual physiotherapy clinic platform. Built with React + Vite, styled like Marham.pk (Pakistan's leading healthcare platform).

---

## 📌 Project Overview

PhysioDesk connects patients with physiotherapists through a modern, responsive web interface. Features three complete role-based dashboards for patients, doctors, and admins.

---

## 🔗 Backend Repository

👉 **[physiodesk (Laravel API)](https://github.com/muhammad-Kafeel/physiodesk)** — Laravel 10 + MySQL

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 19 | UI framework |
| Vite 5 | Build tool & dev server |
| Bootstrap 5 | CSS framework |
| React Router v7 | Client-side routing |
| Axios | HTTP client |
| React Toastify | Toast notifications |
| Lucide React | Icon library |
| React Hook Form | Form handling |

---

## 🎨 Design System

```css
--primary:       #014E78   /* Main blue */
--teal:          #0F766E   /* Doctor/action green */
--accent:        #F34770   /* Highlight red */
--amber:         #F5960B   /* Warning/star color */
```

Inspired by **Marham.pk** — Pakistan's leading online doctor platform.

---

## 📁 Project Structure

```
src/
├── api/
│   ├── axios.js          # Axios instance with auth interceptors
│   └── services.js       # All API calls organized by module
├── context/
│   └── AuthContext.jsx   # Auth state, login/logout, role helpers
├── routes/
│   └── AppRouter.jsx     # All routes with Private/Guest/Role guards
├── components/
│   ├── layout/
│   │   ├── Header.jsx    # Marham-style header with search & city picker
│   │   ├── Footer.jsx    # Full footer
│   │   ├── Layout.jsx    # Public page wrapper
│   │   ├── DashboardLayout.jsx  # Dashboard wrapper with sidebar
│   │   ├── Navbar.jsx    # Dashboard top nav
│   │   └── Sidebar.jsx   # Role-based sidebar navigation
│   └── common/
│       └── Spinner.jsx
└── pages/
    ├── LandingPage.jsx         # Home page
    ├── auth/
    │   ├── LoginPage.jsx       # Login with test account buttons
    │   └── RegisterPage.jsx    # Patient/Doctor registration
    ├── patient/
    │   ├── PatientDashboard.jsx
    │   ├── DoctorListing.jsx   # Search & filter doctors
    │   ├── DoctorDetail.jsx    # Doctor profile + booking
    │   ├── BookAppointment.jsx # Date/time picker + summary
    │   ├── PaymentPage.jsx     # JazzCash/EasyPaisa/Bank/COD
    │   ├── MyAppointments.jsx  # Tabbed appointment list
    │   ├── PharmacyPage.jsx    # Medicine grid + cart drawer
    │   ├── MyOrders.jsx        # Order history
    │   ├── MyPrescriptions.jsx # Rx list + PDF download
    │   ├── MedicalRecords.jsx  # Encrypted health vault
    │   ├── ComplaintsPage.jsx  # File & view complaints
    │   └── BlogsPage.jsx       # Health blogs
    ├── doctor/
    │   ├── DoctorDashboard.jsx     # Stats + today's appointments
    │   ├── DoctorProfilePage.jsx   # Profile form + time slot manager
    │   ├── DoctorAppointments.jsx  # Confirm/complete appointments
    │   ├── WritePrescription.jsx   # Prescription form + PDF
    │   └── DoctorBlogs.jsx         # Write/edit/delete blogs
    └── admin/
        ├── AdminDashboard.jsx      # Platform analytics
        ├── ManageDoctors.jsx       # Verify/reject doctors
        ├── ManageUsers.jsx         # Toggle status, delete users
        ├── ManageComplaints.jsx    # Resolve complaints
        ├── ManageMedicines.jsx     # Inventory management
        ├── ManageOrders.jsx        # Order status updates
        └── Transactions.jsx        # Payment records
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js 18+ (v22 recommended)
- npm 10+
- Backend running at `http://localhost:8000`

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/muhammad-Kafeel/physiodesk-frontend.git
cd physiodesk-frontend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000/api

# 4. Start development server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🔑 Test Accounts

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| Admin | admin@physiodesk.com | Admin@12345 | /admin/dashboard |
| Doctor | doctor@physiodesk.com | Doctor@12345 | /doctor/dashboard |
| Patient | patient@physiodesk.com | Patient@12345 | /patient/dashboard |

---

## 🌍 Environment Variables

```env
VITE_API_URL=http://localhost:8000/api
```

---

## 🚀 Features by Role

### 👤 Patient
- Browse & search verified doctors by specialization, city, fee
- Book appointments (video call or in-person)
- Pay via JazzCash, EasyPaisa, Bank Transfer, or COD
- Order OTC medicines from pharmacy
- Order Rx medicines using doctor prescription (one-tap)
- View & download prescription PDFs
- Access encrypted medical records vault
- Read & browse health blogs
- File and track complaints

### 👨‍⚕️ Doctor
- Create professional profile (PMDC number, qualifications, fee)
- Manage weekly availability time slots
- Confirm and complete patient appointments
- Write detailed prescriptions with medicines, dosage, instructions
- Create patient medical records
- Write, publish, and manage health blog articles

### 🔧 Admin
- View platform-wide analytics dashboard
- Verify or reject doctor profiles with reason
- Manage all users (activate/suspend/delete)
- Resolve user complaints with admin notes
- Manage medicine inventory (add/edit, stock alerts)
- Update pharmacy order delivery status
- View all payment transactions and revenue

---

## 🔐 Route Guards

```jsx
<PrivateRoute>     // Must be logged in
<GuestRoute>       // Must NOT be logged in (login/register pages)
<RoleRoute role="doctor">   // Doctor only
<RoleRoute role="admin">    // Admin only
```

---

## 📡 API Integration

All API calls are centralized in `src/api/services.js`:

```js
authAPI       // login, register, logout, me
doctorAPI     // profile, time slots, appointments, confirm/complete
patientAPI    // profile, prescriptions, medical records, orders
appointmentAPI// book, cancel, reschedule
pharmacyAPI   // medicines, orders, prescription orders
paymentAPI    // pay appointment, pay order
prescriptionAPI // view, download PDF, create
medicalRecordAPI// view, create
complaintAPI  // list, create, resolve
blogAPI       // list, my blogs, create, update, delete
reviewAPI     // doctor reviews, submit review
adminAPI      // dashboard, users, doctors, medicines, orders, complaints, transactions
```

---

## 🏗️ Build for Production

```bash
npm run build
```

Output goes to `dist/` folder.

---

## 👨‍💻 Developer

**Muhammad Kafeel**
- GitHub: [@muhammad-Kafeel](https://github.com/muhammad-Kafeel)
- Email: kafeelkafridi@gmail.com

---

## 📄 License

This project is developed as a **Final Year Project** for academic purposes.
