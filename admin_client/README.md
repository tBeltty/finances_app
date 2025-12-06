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
- **Architecture**: MVC-style (Hooks as Controllers)

## Development
```bash
npm install
npm run dev
```

## Release Protocol
- Versioning is independent of the main `finances-client`.
- Tags: `admin-vX.Y.Z`

