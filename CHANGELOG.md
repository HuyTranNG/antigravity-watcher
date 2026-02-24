# Changelog

All notable changes to the "antigravity-watcher" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.5] - 2026-02-24

### Changed
- **Gemini 3 Branding**: Updated model grouping to explicitly support "Gemini 3 Pro" and "Gemini 3 Flash" with new "G3P" and "G3F" short names.

## [1.0.4] - 2026-02-10

### Added
- **Claude Opus 4.6 Support**: Added support for the newly released Claude Opus 4.6 model.

### Changed
- **Dynamic Model Grouping**: Claude and GPT models are now auto-grouped dynamically based on their display name prefix, eliminating the need to manually update the group list when new models are added.
- **Dynamic Sort Order**: Model sorting is now derived from group definitions instead of a hardcoded priority map, making it automatically adapt to new models.

## [1.0.3] - 2026-01-28

### Changed
- Reverted multi-account support to stabilize the extension (currently limited to single account monitoring).

## [1.0.2] - 2026-01-26

### Added
- **New App Icon**: Updated extension icon with a modern, minimalist "Arch + Eye" design in VS Code marketplace style.
- **New Tab Icon**: Updated Activity Bar icon to match the new app identity.

## [1.0.1] - 2026-01-25

### Added
- **Quota Charts**: New Activity Bar tab featuring rich visualizations of usage and reset times using glassmorphism aesthetics.
- **Improved Status Bar**: Displays group short names and color-coded status icons for quick health checks.
- **Auto-Update**: Background refresh mechanism (configurable interval) to keep data fresh without manual intervention.
- **Advanced Configuration**: Customizable refresh intervals, health thresholds, and status icons.

### Changed
- Refined model grouping logic for shared quotas across Gemini and Claude/GPT models.

### Fixed
- Improved edge-case handling for "out of quota" detection.
- Fixed status icon display consistency.
- Corrected command titles in the Command Palette.

## [1.0.0] - 2026-01-21

### Added
- Initial release of Antigravity Watcher.
- Zero-config automated discovery of local Antigravity instances.
- Core status bar integration for real-time monitoring.
- Support for major model families (Gemini, Claude, GPT, Mistral).
- MIT License.
