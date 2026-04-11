# Roadmap: Antigravity Watcher

## Overview

This roadmap focuses on Milestone v1.0: Auto-retry for High Traffic Errors. We will move from research and reproduction of errors to building a robust retry core with exponential backoff, and finally to providing clear UI feedback to the user when retries are in progress.

## Phases

- [x] **Phase 1: Research & Error Detection** - Reproduce and identify "High Traffic" errors (429 and text match).
- [x] **Phase 2: Exponential Backoff Core** - Implement the retry mechanism with exponential delay and a 5-attempt limit.
- [x] **Phase 3: UI Feedback & Progress** - Add status bar and progress indicators for active retries.
- [x] **Phase 4: Validation & Edge Cases** - Comprehensive testing and final polish.
- [ ] **Phase 5: Configuration & Versioning** - Implement user-configurable retry toggle and prepare for release.

## Phase Details

### Phase 1: Research & Error Detection
**Goal**: Reproduce and correctly identify "High Traffic" errors from the API.
**Depends on**: Nothing (first phase)
**Requirements**: RETRY-01, RETRY-02
**Success Criteria** (what must be TRUE):
  1. The extension can distinguish between a standard 500 error and a 429 "High Traffic" error.
  2. The extension correctly identifies the "Our servers are experiencing high traffic..." message in the response body.
  3. Error detection logic is verified with a reproduction script or mock server.
**Plans**: 2 plans

### Phase 2: Exponential Backoff Core
**Goal**: Implement the retry loop with exponential backoff and attempt limits.
**Depends on**: Phase 1
**Requirements**: RETRY-03, RETRY-04
**Success Criteria** (what must be TRUE):
  1. Failed "High Traffic" requests automatically trigger a retry.
  2. Each retry wait time increases exponentially (e.g., 1s, 2s, 4s...).
  3. The system stops retrying after exactly 5 attempts and reports the final error.
**Plans**: 2 plans

### Phase 3: UI Feedback & Progress
**Goal**: Show retry status and progress in the VS Code UI.
**Depends on**: Phase 2
**Requirements**: UI-01, UI-02, UI-03
**Success Criteria** (what must be TRUE):
  1. Status bar displays "Retrying..." and the current attempt count (e.g., "2/5").
  2. User sees a visible countdown or progress bar indicating when the next retry will occur.
  3. Webview reflects the "Retrying" state with relevant details.
**Plans**: 2 plans
**UI hint**: yes

### Phase 4: Validation & Edge Cases
**Goal**: Final testing and ensuring robust behavior under various conditions.
**Depends on**: Phase 3
**Requirements**: (All v1 requirements)
**Success Criteria** (what must be TRUE):
  1. Retry mechanism handles successful recovery (e.g., server becomes available after 2nd retry).
  2. Retry mechanism handles total failure (all 5 attempts fail) gracefully.
  3. UI correctly cleans up after the retry cycle ends.
**Plans**: 2 plans
**UI hint**: yes

### Phase 5: Configuration & Versioning
**Goal**: Implement the `antigravity-watcher.enableRetry` toggle and upgrade extension version.
**Depends on**: Phase 4
**Requirements**: CONFIG-01, VERSION-01
**Success Criteria** (what must be TRUE):
  1. Users can enable/disable the retry mechanism via VS Code settings.
  2. `ReactorCore` honors the `enableRetry` setting (no retries if disabled).
  3. Extension version is upgraded to `1.0.6` in `package.json`.
  4. `CHANGELOG.md` reflects the new version and features.
**Plans**: 2 plans

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Research & Error Detection | 2/2 | Completed | 2025-02-13 |
| 2. Exponential Backoff Core | 2/2 | Completed | 2025-02-13 |
| 3. UI Feedback & Progress | 2/2 | Completed | 2025-02-13 |
| 4. Validation & Edge Cases | 2/2 | Completed | 2025-02-13 |
| 5. Configuration & Versioning | 0/2 | In Progress | - |
