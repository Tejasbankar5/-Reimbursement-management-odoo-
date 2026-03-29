<div align="center">
  <h1>🚀 Smart Reimbursement Management System</h1>
  <h3><i>Intelligent Approval Engine for Modern Enterprises</i></h3>
  <p>An advanced, automated, and self-healing SaaS platform designed to eliminate the friction in corporate expense management. It brings complete transparency, dynamic workflows, and smart fraud detection to your reimbursement pipelines.</p>
</div>

---

## 🧠 Problem Statement

In many organizations, managing employee reimbursements is a tedious, manual, and error-prone process. The primary inefficiencies include:
* **Rigid Workflows**: Lack of flexibility for special cases like percentage-based approvals or specific escalations.
* **Manual Data Entry**: Employees spend unnecessary time inputting receipt details linearly, leading to human errors.
* **Lack of Transparency**: Both employees and managers suffer from zero visibility over the real-time status of claims.
* **Fraud & Risk**: High vulnerability to duplicate expenses and out-of-policy claims.
* **Delays**: Approval bottlenecks and missing auto-escalation features lead to delayed payouts.

---

## 💡 Solution Overview

The **Smart Reimbursement Management System** modernizes the entire workflow by replacing outdated processes with an intelligent, self-driving approval engine.

Our platform guarantees:
* **Intelligent Approval Engine**: Dynamic rules routing expenses exactly where they need to go, securely and transparently.
* **Smart Automation**: OCR-based autonomous receipt scanning with confidence scoring for instant and accurate data entry. 
* **Workflow Flexibility**: From simple manager approvals to complex, multi-tiered (hybrid, specific, percentage) chains.
* **Risk Mitigation**: Proactive duplicate fraud detection and contextual anomaly indicators.

---

## ✨ Key Features

### 🔐 Authentication & User Management
* **Role-Based Architecture**: Robust segregation between `ADMIN`, `MANAGER`, and `EMPLOYEE` tiers.
* **Secure Login**: Session handling driven by JWT (JSON Web Tokens) and Bcrypt password hashing.

### 💸 Expense Management
* **Multi-Currency Support**: Real-time equivalent visualizations natively baked in.
* **Frictionless Submission**: Effortless expense payload entry with structured categorization.
* **Intelligent OCR Parsing**: AI automatically extracts amounts, vendor names, and dates using Tesseract.js, calculating an internal confidence score.

### 🧠 Approval Engine
* **Multi-Level Workflows**: Sequence-based custom stages for any corporate need.
* **Percentage Rule**: Requires a specific percentage of approvers in a pool to sign off.
* **Specific Approver Rule**: Hardcoded overrides (e.g., CFO *must* sign off on amounts > $5,000).
* **Hybrid Rule System**: A dynamic combining pattern handling edge-case logic and sequential matrices effortlessly.

### 📊 Smart Features
* **Risk Indicator**: Built-in alerting system for anomalous or extraordinarily high expenses.
* **Fraud Detection**: Deep scanning of historical submissions to prevent duplicate logic.
* **Explainable Approvals**: Textual or visual timeline breakdown explaining *why* an expense routed a certain way.

### 🔄 Automation
* **Self-Healing Workflow**: Dead-end handling and timeout fallbacks securely re-route orphaned expenses.
* **Auto-Escalation**: SLAs attached to pending expenses dynamically bump them up the corporate ladder.

### 🎨 UI/UX
* **Professional Dashboard**: A beautifully crafted, glassmorphism-inspired UI for all roles, utilizing Framer Motion for deep interactions.
* **Timeline Visualization**: Visually mapped out steps for an expense.
* **Dynamic Notifications**: Real-time updates delivered smoothly via React Hot Toast.

---

## 🏗️ System Architecture

The project consists of three cleanly separated layers:
* **Frontend (React)**: Handles the presentation logic, global state, UI caching, and routing. Evaluates JWT tokens locally for route guarding. Interacts directly with out unified API layer.
* **Backend (Node.js + Express.js)**: A lightweight, performant API orchestrator mapping business logic and complex validation handling. Interfaces heavily with Prisma ORM for type-safe database mutations.
* **Database (MySQL)**: The deeply relational, fully normalized system of record ensuring referential integrity of our dynamic workflow nodes.

**Data Flow**: The frontend submits an encrypted payload with receipt binaries. The Node server immediately triggers OCR and evaluates initial rules, saving to MySQL. Manager/Admin actions trigger state-machine transitions evaluated against the dynamic workflow engine logic stored relationally.

---

## 🛠️ Tech Stack

**Frontend:**
* React.js 19
* Tailwind CSS
* Framer Motion
* Radix UI
* React Router DOM (v7)

**Backend:**
* Node.js
* Express.js 5.x
* Prisma ORM
* JWT / Bcrypt

**Database:**
* MySQL (Hosted via Aiven Cloud)

**Other/Utilities:**
* Tesseract.js (OCR processing)
* Axios (Data Fetching)
* React Hot Toast (Notifications)
* Date-fns (Temporal calculations)
* Multer (File Handling)

---

## 🗄️ Database Schema

The core relational models ensuring strict referential integrity.

### `Company`
* **Purpose**: Multi-tenant wrapper to partition user data.
* **Key Fields**: `id`, `name`, `baseCurrency`.
* **Relationships**: Has many users, workflows, and expenses.

### `User`
* **Purpose**: Core identity module resolving logins and hierarchies.
* **Key Fields**: `id`, `email`, `role`, `managerId`.
* **Relationships**: Belongs to a company. Self-referential relation to `manager`. Has many expenses.

### `Workflow`
* **Purpose**: Connects approval pipelines to specific companies.
* **Key Fields**: `id`, `isActive`, `name`.
* **Relationships**: Belongs to a company. Has many `WorkflowStep` items.

### `WorkflowStep` (Rules Engine)
* **Purpose**: The matrix definitions holding individual configuration requirements.
* **Key Fields**: `sequenceIndex`, `approverId`, `ruleType` (SEQUENCE, PERCENTAGE, HYBRID), `ruleValue`.
* **Relationships**: Belongs to a Workflow.

### `Expense`
* **Purpose**: Tracks actual payload values and current state variables.
* **Key Fields**: `amount`, `receiptUrl`, `status` (PENDING, APPROVED, REJECTED), `currentStepIndex`.
* **Relationships**: Linked to an owning User and Company. Related to multiple `ExpenseApproval` nodes.

### `ExpenseApproval` (Approvers tracking)
* **Purpose**: A transactional tracking log of users interacting with a specific expense.
* **Key Fields**: `stepIndex`, `approverId`, `status`, `comments`.
* **Relationships**: Belongs to an Expense and points to the User who made the approval decision.

---

## ⚙️ Setup Instructions

### 📥 1. Clone Repo
```bash
git clone <repo-url>
cd <project-folder>
```

### 📦 2. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### ⚙️ 3. Environment Setup

Create a `.env` file in the **backend** directory:
```env
DATABASE_URL="mysql://your_user:your_password@your_host:your_port/your_database?ssl-mode=REQUIRED"
PORT=5000
JWT_SECRET="your_secret_key"
```

### ▶️ 4. Run Project

Run the backend API (from `/backend`):
```bash
npm run dev
```

Run the frontend client (from `/frontend`):
```bash
npm run dev
```

---

## 🔄 API Overview

Important core transactional endpoints.

**Auth:**
* `POST /api/auth/login` - Generates JWT.
* `POST /api/auth/signup` - Hashes user payload & stores securely.

**Expenses:**
* `POST /api/expenses` - (Supports `multipart/form-data` with OCR scanning).
* `GET  /api/expenses` - Resolves all expenses linked to role scopes.

**Approvals:**
* `POST /api/expenses/:id/approve` - Triggers state engine transitions.
* `GET  /api/expenses/:id/approvals` - View timeline of approvals.

**Workflows / Rules:**
* `POST /api/workflows` - Admin create new dynamic pipeline logic.
* `GET  /api/workflows` - Fetches configuration nodes.

---

## 🧪 Testing Workflow

1. **Initialize Admin**: Login with root credentials to configure your organizational hierarchy.
2. **Simulate User Journey**: Submit an expense payload containing a receipt image -> wait 2 seconds for Tesseract.js OCR auto-fill mapping.
3. **Trigger Duplicate Rule**: Try to upload the exact same transaction consecutively to watch Risk indicator APIs intercept.
4. **Approval Demo**: Log out and access via Manager to trigger an approval step, updating the timeline asynchronously.
5. **Edge Cases**: Explore the hybrid fallback timeouts via backend testing tools.

---

## 🎯 Unique Selling Points

* 🚀 **Dynamic Rule Engine**: Unlike static legacy tools, workflows are programmable on the fly directly from the UI.
* 🧠 **Explainable Decisions**: Every UI state presents a precise textual or visual explanation detailing *why* your expense is blocked or approved.
* 🤖 **OCR with Confidence Scoring**: The system tells you how likely the AI thinks the receipt data is correct, enforcing manual checks only when it genuinely isn't confident.
* 🛡️ **Self-Healing Architectures**: Broken chains automatically reroute avoiding multi-day gridlocks.

---

## 📸 Screenshots & Demo

*(Images placeholder – to be populated upon final deployment)*

* **Dashboard Flow**
  `![Dashboard Demo](/path/to/img)`
* **Expense Form & OCR**
  `![OCR Mapping](/path/to/img)`
* **Approval Timeline**
  `![Approvals View](/path/to/img)`

---

## 🚀 Future Enhancements

* **AI-Based Prediction**: Anticipatory categorization logic learning from massive enterprise datasets.
* **Native Mobile App**: Complete feature parity deployed on iOS and Android via React Native.
* **Accounting Sync**: Real-time integration webhooks securely broadcasting events to Xero/QuickBooks.

---

## 👨💻 Contributors

* Developed & architected by the **Team**

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
