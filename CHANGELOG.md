# Changelog

## [1.4.16] - 2025-12-06
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
