# 🚀 ReimburseIQ — Enterprise Expense Management

ReimburseIQ is a premium, full-stack enterprise reimbursement system designed to handle multi-step approval workflows, automated receipt extraction (OCR), multi-currency conversions, and an auditable trail of expense claims. 

It features a stunning, animated **Aceternity-inspired UI** with true glassmorphism, Aurora mesh gradients, and interactive spotlight cards.

---

## ✨ Key Features
- **Strict 2-Step Approval Chain**: Employee ➡️ Manager ➡️ Director (Admin). No skipped steps, fully auditable.
- **AI Receipt Scanning**: Integrated `tesseract.js` for automatic OCR data extraction from uploaded receipts.
- **Multi-Currency Support**: Uses live exchange rates (`ExchangeRate-API`) to auto-convert submitted currencies (USD, EUR, GBP, JPY, AUD) into the company's base currency (INR).
- **Role-Based Portals**: Separate login flows and dashboards for Employees, Managers, and Directors.
- **Aceternity UI Aesthetics**: Built with Framer Motion to provide a deeply interactive, floating glassmorphism experience with stagger animations, animated stats, and glow effects.
- **Admin Overrides**: Directors can force-approve or force-reject any stuck claims, with full audit logging.

---

## 🛠️ Tech Stack
| Tier | Technologies Used |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, React Router, Framer Motion, Lucide React |
| **Backend** | Node.js, Express, TypeScript, Sequelize ORM, JWT, Tesseract.js (OCR), Axios |
| **Database** | MySQL |
| **Design System** | Custom CSS-variable powered Light Theme with Mesh Gradients & Glassmorphism |

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- MySQL Server (running on port 3306)

### 1. Database Setup
1. Open MySQL and create the database:
   ```sql
   CREATE DATABASE reimbursement_db;
   ```
2. Update the credentials in `backend/src/db.ts` if needed (Default: `root` / `root`).

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```
*The backend will run on `http://localhost:5000` and automatically sync the Sequelize models.*

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*The React app will be served on `http://localhost:5173`.*

---

## 🔐 Default Test Accounts
If you registered the first user, they are automatically designated as the **ADMIN / Director**. From the Admin dashboard, you can create Managers and Employees.

You can create test accounts using the UI:
- **Admin**: Create the first account via `/signup`.
- **Manager/Employee**: Created by the Admin in the "Users" tab of the Admin portal.

---

## 📸 Screenshots & UI Highlights
* **Landing Page**: Features a "Spotlight" card grid and Aurora mesh background.
* **Dashboards**: Glassmorphism cards with deep colored shadows and staggered entrance animations.
* **Timeline**: Visual 4-step progress tracker on each employee's expense card.

---

*Built with ❤️ for enterprise structured workflows.*
