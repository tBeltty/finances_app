# Changelog

## [Client 1.5.1] - 2025-12-06
### Added
- **Advanced Bank Credits**: New fields for bank loans (monthly insurance, commissions, current installment, remaining balance).
- **Bank Credit Toggle**: Enable additional fields in advanced mode when dealing with bank credits.
### Fixed
- **Loan Modal**: DatePicker for date selection instead of native input.
- **Amount Field**: Currency-aware number formatting.

## [Client 1.5.0] - 2025-12-06
### Added (Loans Enhancement - Debt Management Center)
- **Overdue Tracking**: Red border and badge for past-due loans. Added `overdue`/`forgiven` statuses.
- **Payment Reminders**: In-app notifications 3 days and 1 day before due date.
- **Debt Projection Tool**: "What If?" modal shows impact of extra payments on payoff time and interest.
- **Forgive Loan**: Ability to forgive/write-off lent loans.
- **Dashboard Enhancements**: Overdue count in summary KPI.
### Localization
- Added ~20 new translation keys for loans.projection and overdue/forgive features.

## [Admin 1.0.4] - 2025-12-06
### Refactor
- **Architecture**: Refactored `Dashboard.jsx` into "View" and "Controller" (Hooks) layers for MVC compliance.
- **Hooks**: Introduced `useAdminUsers`, `useAdminStats`, and `useAuditLogs`.

## [Admin 1.0.3] - 2025-12-06
### Added
- **Localization Center**: Pagination (50 items/page), Category Filtering, and "Enter to Save" support.
- **Enforcement**: Added `eslint-plugin-i18next` to Client project to enforce localization.

## [Admin 1.0.2] - 2025-12-06
### Fixed
- **Admin Dashboard**: Fixed Localization Center reporting 0% coverage by implementing hybrid file+DB scanning.
- **Mobile**: Fixed notification dropdown alignment (now fully visible).
- **Localization**: Added missing keys for Notification Center.
- **UI**: Improved contrast in Light Mode for notifications.
### Added
- **Notification Center**: Real-time notification system in the navigation bar.
  - **Multilingual Support**: Automatically delivers notifications in English or Spanish based on user preference.
  - **Smart Delivery**: Fetches from backend API, supports dynamic icons (success, error, warning).
  - **Premium UI**: Frosted glass aesthetics (85% opacity, 3XL blur) matching Dashboard KPI widgets.


### Fixed
- **Version Persistence**: Resolved issue where App version stuck on 1.4.15 due to build caching.
- **Infinite Reload Loop**: Fixed PWA update logic to prevent aggressive reloading.
- **Missing Icon**: Resolved crash in NotificationCenter due to missing axios dependency (replaced with native fetch).
- **UI Transparency**: Fixed "Glass" effect transparency issues by enforcing correct opacity values and blur levels.

### Changed
- **Update Strategy**: Reverted to silent auto-updates for seamless user experience.
- **Dependencies**: Removed unused dependencies and cleaned up build scripts.
