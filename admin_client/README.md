# tBelt Admin Dashboard

The administrative control panel for the tBelt Finances ecosystem.

## Features
- **User Management**: View, promote, and delete users.
- **Analytics**: Real-time stats on users, loans, and system usage.
- **Security Logs**: Audit trail of all critical actions (login, delete, promote).
- **Localization Center**: Manage EN/ES translations dynamically (Database + File overrides).
- **System Hub**: Monitor server health and send global broadcasts.

## Tech Stack
- **Framework**: React 19 + Vite
- **Styling**: TailwindCSS v4 + Glassmorphism
- **State**: React Context (Auth)
- **Architecture**: Component-Based with Separation of Concerns (View/Logic)
- **Pattern**: Custom Hooks for Business Logic (e.g., `useAdminUsers`)

## Project Structure
```
admin_client/
├── src/
│   ├── components/     # UI Components (Modals, Stats, Tables)
│   ├── context/        # Global State (AuthContext)
│   ├── hooks/          # Business Logic (Controllers)
│   │   ├── useAdminStats.js
│   │   ├── useAdminUsers.js
│   │   └── useAuditLogs.js
│   └── pages/          # View Layer (Dashboard.jsx)
├── public/             # Static Assets
└── vite.config.js      # Build Configuration
```

## Development
```bash
npm install
npm run dev
```

## Release Protocol
- Versioning is independent of the main `finances-client`.
- Tags: `admin-vX.Y.Z`

