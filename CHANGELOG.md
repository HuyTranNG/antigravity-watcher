# Changelog

All notable changes to the "antigravity-watcher" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
