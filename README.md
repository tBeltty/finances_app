# tBelt Finances v1.4

A modern, comprehensive web application for personal and shared financial management, built with React, Node.js, and PostgreSQL.

![Version](https://img.shields.io/badge/version-1.4.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ What's New in v1.4

### 💰 Loans Module
- **Track Loans:** Manage money you lend or borrow with detailed records
- **Payment Schedules:** Automatic installment calculation
- **Effective Annual Interest Rate:** Professional EA calculation with amortization formula
- **Simple & Compound Interest:** Choose your preferred interest type

### 🚀 Enhanced Onboarding
- **Income Frequency:** Set if you receive income monthly, biweekly, or weekly
- **Loan Preferences:** Pre-configure default interest type for new loans
- **Localized App Title:** tBelt Finances (EN) / tBelt Finanzas (ES)

## Key Features

### 💰 Financial Management
- **Expenses:** Detailed tracking of fixed and variable expenses
- **Categories:** Flexible categorization with custom colors and templates
- **Savings:** Dedicated widget for savings goals and expense payments
- **Loans:** Track debts and credits with interest calculations
- **Multi-currency:** Native support for USD, EUR, COP, MXN, ARS, HNL

### 📊 Dashboard & Analytics
- **Real-time KPIs:** Balance, Total Expenses, Pending Payments, Projected Balance
- **Visualization:** Intuitive charts for expense breakdown by category
- **Filters:** Navigation by month/year with day-specific views
- **Sorting:** Analyze expenses by date or amount

### 🏠 Collaborative Households
- **Shared Spaces:** Create multiple "Households" (Personal, Home, Business)
- **Collaboration:** Invite family members or partners via invite codes
- **Roles:** Permission management (Owner, Member)

### 🎨 Theming System
- **3 Unique Themes:** Cosmic Slate, Takito (warm orange), Cookie (cool blue)
- **Light/Dark Modes:** Each theme fully supports both modes
- **Glassmorphism UI:** Modern glass-effect design across all components

### 🔒 Security & Technology
- **Robust Authentication:** JWT with secure sessions
- **2FA (Two-Factor):** Optional TOTP security (Google Authenticator compatible)
- **PWA:** Installable on mobile devices as a native-like app
- **Responsive Design:** Optimized for mobile and desktop

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- Resend Account (for transactional emails)

## Quick Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tBeltty/finances_app.git
   cd finances_app
   ```

2. **Install dependencies:**
   ```bash
   npm run install:all
   ```

3. **Automatic Configuration:**
   ```bash
   node setup_wizard.cjs
   ```

4. **Start the application:**
   ```bash
   npm run dev
   ```

## Manual Configuration (.env)

Create a `server/.env` file:

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

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, Vite, TailwindCSS v4, Lucide Icons, Recharts |
| **Backend** | Node.js, Express, Sequelize ORM |
| **Database** | PostgreSQL |
| **Infrastructure** | Nginx + PM2 (VPS), PWA support |

## Project Structure

```
.
├── client/                 # Frontend (React + Vite)
│   ├── public/             # Static assets (PWA icons, themes)
│   ├── src/
│   │   ├── components/     # UI Components
│   │   ├── context/        # Global State (Auth, Theme)
│   │   ├── hooks/          # Custom Hooks
│   │   ├── locales/        # i18n translations (en, es)
│   │   └── views/          # Page Views
│   └── tailwind.config.js  # TailwindCSS Configuration
├── server/                 # Backend (Node.js + Express)
│   ├── controllers/        # API Logic
│   ├── middleware/         # Auth & Validation
│   ├── models/             # Sequelize Models
│   └── services/           # External Services
├── setup_wizard.cjs        # Interactive Setup Script
└── package.json            # Monorepo Orchestration
```

## Version History

| Version | Release | Highlights |
|---------|---------|------------|
| v1.4.0 | Dec 2024 | Loans module, Effective Annual Interest, Enhanced Onboarding |
| v1.3.0 | Dec 2024 | Complete theming system, semantic colors, glassmorphism |
| v1.2.0 | Nov 2024 | Full i18n support, Spanish/English translations |
| v1.1.0 | Nov 2024 | Monorepo refactor, client/server separation |
| v1.0.0 | Nov 2024 | Initial release |

---

© 2025 tBelt Finances App. All rights reserved.
