# LoanSpark — Full-Stack Loan Management System

> Next.js 14 · TypeScript · Tailwind CSS · Node.js · Express · MongoDB · JWT

---

## 📁 Project Structure

```
loanspark/
├── backend/          # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── config/       database.ts
│   │   ├── controllers/  auth, loan, payment, user, dashboard
│   │   ├── middleware/   auth (JWT+RBAC), errorHandler, upload (multer)
│   │   ├── models/       User, Loan, Payment (Mongoose)
│   │   ├── routes/       auth, loans, payments, users, upload, dashboard
│   │   ├── utils/        jwt.ts, bre.ts, seed.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/         # Next.js 14 App Router + TypeScript + Tailwind
    ├── src/
    │   ├── app/
    │   │   ├── auth/login/       Sign-in page (demo quick-login buttons)
    │   │   ├── auth/register/    Borrower self-registration
    │   │   ├── borrower/apply/   4-step multi-form with live BRE + loan calc
    │   │   ├── borrower/loans/   My loans + payment history
    │   │   └── dashboard/
    │   │       ├── overview/     Admin stats + recent activity
    │   │       ├── sales/        Lead tracking
    │   │       ├── sanction/     Approve / reject with BRE display
    │   │       ├── disbursement/ Disburse + auto-UTR
    │   │       ├── collection/   Record payments, auto-close on full repay
    │   │       └── users/        Executive CRUD (admin only)
    │   ├── components/
    │   │   ├── layout/   Sidebar, Topbar, AppShell
    │   │   └── ui/       StatusBadge, StatCard, Modal, Spinner
    │   ├── hooks/        useAuth.ts
    │   ├── lib/          api.ts (axios), auth.ts (helpers)
    │   └── types/        index.ts (all interfaces)
    ├── package.json
    └── tailwind.config.js
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js ≥ 18
- MongoDB running locally (`mongod`) or MongoDB Atlas URI

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
    #PORT=5000
    # edit MONGODB_URI and JWT_SECRET
    # JWT_EXPIRES_IN=7d
    # NODE_ENV=development
    # FRONTEND_URL=http://localhost:3000
    # MAX_FILE_SIZE=5242880
    # UPLOAD_DIR=uploads

npm install
npm run seed               # creates all 6 demo accounts
npm run dev                # starts on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env.local  # set NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm install
npm run dev                 # starts on http://localhost:3000
```

---

## 🔑 Demo Accounts (after seeding)

| Role         | Email                     | Password    |
|-------------|---------------------------|-------------|
| Borrower     | borrower@loanspark.com    | Borro@123   |
| Admin        | admin@loanspark.com       | Admin@123   |
| Sales        | sales@loanspark.com       | Sales@123   |
| Sanction     | sanction@loanspark.com    | Sanct@123   |
| Disbursement | disburse@loanspark.com    | Disbu@123   |
| Collection   | collect@loanspark.com     | Colle@123   |

---

## 📡 API Endpoints

### Auth
| Method | Route                   | Access    |
|--------|------------------------|-----------|
| POST   | /api/auth/register     | Public    |
| POST   | /api/auth/login        | Public    |
| GET    | /api/auth/me           | Any auth  |
| PUT    | /api/auth/profile      | Any auth  |
| PUT    | /api/auth/change-password | Any auth |

### Loans
| Method | Route                      | Access             |
|--------|---------------------------|--------------------|
| POST   | /api/loans                | Borrower           |
| GET    | /api/loans/my             | Borrower           |
| GET    | /api/loans                | Ops + Admin        |
| GET    | /api/loans/:id            | Any auth           |
| PATCH  | /api/loans/:id/sanction   | Sanction, Admin    |
| PATCH  | /api/loans/:id/reject     | Sanction, Admin    |
| PATCH  | /api/loans/:id/disburse   | Disbursement, Admin|
| POST   | /api/loans/:id/salary-slip| Borrower           |

### Payments
| Method | Route                       | Access              |
|--------|-----------------------------|---------------------|
| POST   | /api/payments               | Collection, Admin   |
| GET    | /api/payments/loan/:loanId  | Collection, Admin   |

### Users (Admin)
| Method | Route                  | Access |
|--------|------------------------|--------|
| GET    | /api/users             | Admin  |
| POST   | /api/users/executive   | Admin  |
| PATCH  | /api/users/:id/toggle  | Admin  |
| GET    | /api/users/leads       | Sales, Admin |

### Dashboard
| Method | Route                  | Access    |
|--------|------------------------|-----------|
| GET    | /api/dashboard/stats   | Ops+Admin |
| GET    | /api/dashboard/activity| Ops+Admin |

---

## ⚙️ Business Rules (BRE)

| Rule       | Condition              |
|------------|------------------------|
| Age        | 23 – 50 years          |
| Salary     | ≥ ₹75,000/month        |
| PAN        | Format: ABCDE1234F     |
| Employment | Not unemployed         |

All 4 must pass. BRE runs server-side — cannot be bypassed.

---

## 🔒 Loan Status Flow

```
applied → sanctioned → disbursed → closed
       ↘ rejected
```

- Loan auto-closes when total payments ≥ total repayment
- Disburse UTR auto-generated as `UTR{timestamp}{rand}`
- Payment UTR must be globally unique (DB constraint)

---

## 🛡️ Security
- Passwords hashed with bcrypt (12 rounds)
- JWT tokens (7-day expiry), verified on every request
- RBAC enforced on **both frontend routes and backend API**
- Rate limiting: 100 req/15min global, 10 req/15min for auth
- Helmet.js for HTTP security headers
- Multer validates file type + 5MB size limit
