# CrediSea - Advanced Loan Management System

CrediSea is a complete end-to-end full-stack lending platform where borrowers can apply for loans, get evaluated by an automated Business Rule Engine (BRE), and internal executives can manage the loans through their lifecycle.

---

## 🌟 Key Features

1. **Borrower Journey**:
   - **Signup & Signin**: Hashed passwords using bcrypt and route protection.
   - **Eligibility check**: Server-side and client-side BRE validations for Age (23-50), Minimum Salary (₹25,000), PAN format verification, and Employment Mode check (cannot be Unemployed).
   - **Salary Slip upload**: Up to 5 MB file upload supporting PDF, JPG, JPEG, and PNG.
   - **Interactive Sliders**: Simple Interest calculation panel updating in real-time.
2. **Operations Dashboard**:
   - **Lead Tracking (Sales Module)**: Track users who registered but haven't applied yet.
   - **Appraisal (Sanction Module)**: Sanction Executive reviews, views salary slip documents, and either approves or rejects with a reason.
   - **Disbursement (Disbursement Module)**: Disburse approved loans and start active repayment cycles.
   - **Collections (Collection Module)**: Record borrower payments with UTR checks and outstanding balance validations. Automatic closure of loans upon full repayment.
3. **Role-Based Access Control (RBAC)**:
   - Secured on both Frontend navigation and Backend APIs.
   - Admin view with complete dashboard overview statistics.
4. **Database Robustness**:
   - Automated fallback to an in-memory MongoDB server if no local MongoDB instance is detected, allowing zero-config evaluator setups.

---

## 🔑 Seeder Credentials (Quick Logins)

The project includes an automatic DB seeder script. The login screen features a **"Quick Dev Login Shortcuts"** panel that pre-fills and submits credentials for the following seeded accounts:

| Role | Email | Password | Allowed Dashboard Module |
|---|---|---|---|
| **System Admin** | `admin@credisea.com` | `Admin@123` | Sees ALL modules + Stats |
| **Sales Executive** | `sales@credisea.com` | `Sales@123` | Lead tracking board |
| **Sanction Executive** | `sanction@credisea.com` | `Sanction@123` | Appraise and approve/reject |
| **Disbursement Executive** | `disburse@credisea.com` | `Disburse@123` | Disburse sanctioned loans |
| **Collection Executive** | `collect@credisea.com` | `Collect@123` | Log UTR payments & Close loans |
| **Borrower (Lead)** | `borrower@credisea.com` | `Borrower@123` | Application form steps |

---

## 🏗️ Folder Structure

```
credisea/
├── backend/
│   ├── src/
│   │   ├── config/db.ts              # MongoDB connect & In-Memory fallback
│   │   ├── controllers/
│   │   │   ├── authController.ts     # Login, Signup, profile details
│   │   │   ├── loanController.ts     # Steps 2-4 borrower journey
│   │   │   └── operationsController.ts # Sales, Sanction, Disburse, Collection actions
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts     # JWT session verification
│   │   │   └── roleMiddleware.ts     # RBAC verification
│   │   ├── models/                   # Mongoose Schemas (User, Loan, Payment)
│   │   ├── routes/                   # API Route endpoints mapping
│   │   ├── utils/
│   │   │   ├── bre.ts                # Business Rule Engine logic
│   │   │   └── seeder.ts             # Pre-configured roles database seed script
│   │   └── index.ts                  # Boot server entry point
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx            # Global layout, Inter Font, Auth provider
│   │   │   ├── globals.css           # Premium dark theme and glassmorphism styling
│   │   │   ├── login/page.tsx        # Login page with dev login shortcuts
│   │   │   ├── register/page.tsx     # Borrower registration form
│   │   │   ├── portal/page.tsx       # 4-step wizard borrower application form
│   │   │   └── dashboard/page.tsx    # Role-based Executive Operations Panel
│   │   ├── context/AuthContext.tsx   # React context managing session and tokens
│   │   ├── utils/api.ts              # Axios interceptor forwarding Bearer tokens
│   │   └── types/index.ts            # Type safety contracts
│   ├── .env.local
│   └── package.json
└── README.md
```

---

## 🚀 Setup & Execution Guide

### Prerequisite
Ensure [Node.js (v18 or higher)](https://nodejs.org/) is installed.

---

### Step 1: Run the Backend Server
Open a terminal in the `backend/` directory:

```bash
cd backend
# Install dependencies
npm install

# Run database seeder (seeds the predefined executive/borrower roles)
npm run seed

# Run the development server (runs on Port 5000)
npm run dev
```

*Note: The backend will automatically try to connect to a local MongoDB instance at `mongodb://127.0.0.1:27017/credisea`. If MongoDB is not running, it will automatically spin up an in-memory MongoDB Server so that the system works without configuration.*

---

### Step 2: Run the Frontend App
Open a new terminal in the `frontend/` directory:

```bash
cd frontend
# Install dependencies
npm install

# Run the Next.js development server (runs on Port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📈 Database Models & Schema Design

### 1. User
- `name` (String, required)
- `email` (String, required, unique)
- `password` (String, required)
- `role` (String: `Admin`, `Sales`, `Sanction`, `Disbursement`, `Collection`, `Borrower`)
- `pan` (String, PAN format)
- `dob` (Date)
- `monthlySalary` (Number)
- `employmentMode` (String: `Salaried`, `Self-Employed`, `Unemployed`)
- `applicationStatus` (String: `Not_Started`, `Details_Completed`, `Slip_Uploaded`, `Applied`, `Rejected`)
- `salarySlipPath` (String, file path)

### 2. Loan
- `borrower` (ObjectId, ref: `User`)
- `amount` (Number, ₹50,000 - ₹5,000,000)
- `tenure` (Number, 30 - 365 Days)
- `interestRate` (Number, 12% p.a. fixed)
- `simpleInterest` (Number, calculated)
- `totalRepayment` (Number, calculated)
- `outstandingBalance` (Number, outstanding repayment amount)
- `status` (String: `APPLIED`, `SANCTIONED`, `DISBURSED`, `CLOSED`, `REJECTED`)
- `rejectionReason` (String)

### 3. Payment
- `loan` (ObjectId, ref: `Loan`)
- `utrNumber` (String, unique)
- `amount` (Number, positive)
- `paymentDate` (Date)
