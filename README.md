# Finances App v1.0

A modern, comprehensive web application for personal and shared financial management, built with React, Node.js, and PostgreSQL.

## Key Features

### 💰 Financial Management
- **Expenses:** Detailed tracking of fixed and variable expenses.
- **Categories:** Flexible categorization system with custom colors and predefined templates.
- **Savings:** Dedicated widget for savings goals and using savings to pay for expenses.
- **Multi-currency:** Native support for USD, EUR, COP, MXN, and HNL.

### 📊 Dashboard & Analytics
- **Real-time KPIs:** Balance, Total Expenses, Accounts Payable, and Projected Balance.
- **Visualization:** Intuitive charts for expense breakdown by category.
- **Filters:** Historical navigation by month and year.
- **Sorting:** Tools to analyze expenses by date or amount.

### 🏠 Collaborative Households
- **Shared Spaces:** Create multiple "Households" (Personal, Home, Business).
- **Collaboration:** Invite family members or partners.
- **Roles:** Permission management (Owner, Member).

### 🔒 Security & Technology
- **Robust Authentication:** JWT and secure sessions.
- **2FA (Two-Factor):** Optional extra security layer with TOTP (Google Authenticator).
- **PWA:** Installable on mobile devices as a native-like app.
- **Responsive Design:** Interface optimized for both mobile and desktop.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- Resend Account (for transactional emails)

## Quick Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/finances-app.git
   cd finances-app
   ```

2. **Install dependencies:**
   ```bash
   npm run install:all
   ```
   *(Or manually install in root, client, and server)*

3. **Automatic Configuration:**
   Run the setup wizard to configure your database and environment variables:
   ```bash
   node setup_wizard.cjs
   ```

4. **Start the application:**
   ```bash
   npm run dev
   ```

## Manual Configuration (.env)

If you prefer manual configuration, create a `server/.env` file:

```env
PORT=3001
DB_NAME=finances_db
DB_USER=postgres
DB_PASS=your_password
DB_HOST=localhost
JWT_SECRET=your_super_secure_secret
RESEND_API_KEY=re_123456789
FROM_EMAIL=noreply@your-domain.com
FRONTEND_URL=http://localhost:5173
```

## Tech Stack

- **Frontend:** React, Vite, TailwindCSS, Lucide Icons, Recharts.
- **Backend:** Node.js, Express, Sequelize (ORM).
- **Database:** PostgreSQL.
- **Infrastructure:** Support for VPS deployment (Nginx + PM2).

## Project Structure

```bash
.
├── client/                 # Frontend (React + Vite)
│   ├── public/             # Static assets (PWA icons, etc.)
│   ├── src/
│   │   ├── components/     # UI Components (Layout, Inputs, etc.)
│   │   ├── context/        # Global State (Auth, UI)
│   │   ├── hooks/          # Custom Hooks (useFinances)
│   │   ├── views/          # Page Views (Dashboard, Expenses, etc.)
│   │   ├── App.jsx         # Main App Component
│   │   └── db.js           # Local IndexedDB Config (Dexie)
│   └── vite.config.js      # Vite Configuration
├── server/                 # Backend (Node.js + Express)
│   ├── config/             # DB Configuration
│   ├── controllers/        # API Logic
│   ├── middleware/         # Auth & Validation Middleware
│   ├── models/             # Sequelize Models (PostgreSQL)
│   ├── services/           # External Services (Email)
│   └── index.js            # Server Entry Point
├── setup_wizard.cjs        # Interactive Setup Script
└── package.json            # Monorepo Orchestration
```

---
© 2025 tBelt Finances App. All rights reserved.
