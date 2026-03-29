# 📊 Reimbursement Management System: Complete System Walkthrough

This document outlines everything happening under the hood of your Reimbursement Management System. It explains the core architecture, data flow, user roles, and specifically **what happens when you click every major button** in the system.

---

## 1. System Architecture
- **Frontend:** Built with React, TypeScript, and Vite. It uses `react-router-dom` for navigation and `axios` for API calls.
- **Backend:** Node.js with Express.
- **Database:** MySQL using the `Sequelize` ORM to automatically map relational objects (Users, Workflows, Expenses) into database tables.
- **Authentication:** Secured via JSON Web Tokens (JWT). When a user logs in, the backend issues a token that the frontend stores and attaches to the headers of all subsequent requests.

---

## 2. User Roles & Dashboards
The application dynamically routes users to different visual dashboards based on their role:

1. **Admin (`AdminDash.tsx`)**: Has global control over the company. They can onboard new users, configure multi-step approval workflows, and forcefully approve/reject any expense in the system.
2. **Manager (`ManagerDash.tsx`)**: The middleman. They receive expenses submitted by employees who report directly to them. They can approve or reject these expenses.
3. **Employee (`EmployeeDash.tsx`)**: The submitter. They can fill out expense forms, upload receipts, and track the live status of their submissions.

---

## 3. Detailed Action Flow (What happens on Button Clicks)

### 🔐 Authentication Flow

#### Button: **"Create Company / Sign Up"** (on `Signup.tsx`)
**What Happens:**
1. Frontend sends a `POST /api/auth/signup` request with the Admin's details and Company name.
2. Backend checks if the email already exists.
3. Backend fetches the base currency for the provided country using a public API (`restcountries.com`).
4. **Database Write (Company):** A new `Company` record is created.
5. **Database Write (User):** A new `User` is created, assigned the `ADMIN` role, attached to the new Company ID, and their password is encrypted using `bcrypt`.
6. Backend generates a JWT token and sends it back. 
7. Frontend stores the token and redirects the admin to their dashboard.

#### Button: **"Login"** (on `Login.tsx`)
**What Happens:**
1. Frontend sends a `POST /api/auth/login` containing email and password.
2. Backend finds the user, verifies the hashed password, and generates a JWT.
3. Frontend saves the JWT and uses `<DashboardRouter />` to redirect to the correct Dashboard based on the user's role (Admin, Manager, or Employee).

---

### 👑 Admin Actions (`AdminDash.tsx`)

#### Button: **"Add User"** (in the User Management Tab)
**What Happens:**
1. Admin fills out a form for a new employee or manager (optionally selecting who their manager is).
2. Frontend sends a `POST /api/admin/users` request (with the Admin's JWT token).
3. Backend verifies the requester is an Admin.
4. **Database Write (User):** A new Employee or Manager record is created and tied to the Admin's Company ID.

#### Button: **"Save Workflow"** (in the Workflow Settings Tab)
**What Happens:**
1. Admin constructs an approval sequence (e.g., Step 1: Specific Manager, Step 2: Admin).
2. Frontend sends a `POST /api/admin/workflows` request with the sequential step data.
3. **Database Write (Workflow):** All older workflows for the company are marked `isActive: false`. A new `Workflow` record is created.
4. **Database Write (WorkflowSteps):** Specific rule steps (e.g., `SEQUENCE`, `SPECIFIC_APPROVER`) are generated and linked to the active Workflow.
5. *Result*: All future expenses submitted by employees will automatically follow this exact chain of command.

#### Button: **"Force Approve" / "Force Reject"** (on an Expense row)
**What Happens:**
1. Admin clicks to override an expense state regardless of whose desk it is currently on.
2. Frontend sends `POST /api/admin/expenses/:id/override`.
3. **Database Update (Expense):** The expense status immediately changes to `APPROVED` or `REJECTED`.
4. **Database Write (ExpenseApproval):** A sentinel tracking log is created (Step Index: 999) to leave an audit trail showing the Admin forcefully overrode the system.

---

### 👨‍💼 Employee Actions (`EmployeeDash.tsx`)

#### Button: **"Submit Expense"**
**What Happens:**
1. Employee fills out Amount, Date, Category, and attaches a Receipt.
2. Frontend sends `POST /api/expenses/` with a FormData payload (if receipt image is included).
3. Backend receives the request and stores the receipt (locally or externally depending on setup).
4. **Database Write (Expense):** An `Expense` record is created with `status: PENDING` and `currentStepIndex: 0`.
5. **Workflow Trigger:** The backend analyzes the company's active `Workflow`. It looks at `Step 0` to figure out who should approve this first.
6. **Database Write (ExpenseApproval):** A pending `ExpenseApproval` task is created and assigned to the specific Approver's ID (e.g., the employee's Direct Manager).

---

### 👔 Manager Actions (`ManagerDash.tsx`)

#### Button: **"Approve"** (on a pending request)
**What Happens:**
1. Manager sees a request assigned to them and clicks Approve.
2. Frontend sends `POST /api/approvals/:expenseId/approve`.
3. **Database Update (ExpenseApproval):** The pending task assigned to this manager is marked `APPROVED`.
4. **System Check:** The backend checks the total `Workflow`. Are there more steps required?
   - **If YES:** The `Expense` record's `currentStepIndex` increments by 1. A new `ExpenseApproval` task is created and assigned to the *next* person in the chain. The overall Expense remains `PENDING`.
   - **If NO (Final Step):** The main `Expense` record's status is finally updated permanently to `APPROVED`.

#### Button: **"Reject"** 
**What Happens:**
1. Manager clicks Reject and provides an optional reason.
2. Frontend sends `POST /api/approvals/:expenseId/reject`.
3. **Database Update (ExpenseApproval):** The step is marked `REJECTED`.
4. **Database Update (Expense):** The entire expense is immediately marked as `REJECTED`. The workflow chain terminates completely. No further steps are generated.

---

## 📬 The Complete Lifecycle of an Expense
1. **Creation:** An Employee submits a dinner receipt.
2. **Routing Step 1:** The system checks the company workflow. The rule says "Direct Manager Must Approve". The request appears on Manager Mike's dashboard.
3. **Action:** Manager Mike hits **Approve**.
4. **Routing Step 2:** The system checks the workflow again. The rule says "Step 2: Admin Must Approve". The request leaves Manager Mike's dashboard and appears on the Admin's dashboard.
5. **Final Action:** Admin hits **Approve**. The Expense reaches the end of the workflow and is officially **Marked as Approved** in the database. The Employee sees a green "Approved" badge on their screen.
