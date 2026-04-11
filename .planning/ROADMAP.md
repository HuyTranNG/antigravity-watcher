# Roadmap: Antigravity Watcher

## Overview

This roadmap focuses on Milestone v1.0: Auto-retry for High Traffic Errors. We will move from research and reproduction of errors to building a robust retry core with exponential backoff, and finally to providing clear UI feedback to the user when retries are in progress.

## Phases

- [ ] **Phase 1: Research & Error Detection** - Reproduce and identify "High Traffic" errors (429 and text match).
- [ ] **Phase 2: Exponential Backoff Core** - Implement the retry mechanism with exponential delay and a 5-attempt limit.
- [ ] **Phase 3: UI Feedback & Progress** - Add status bar and progress indicators for active retries.
- [ ] **Phase 4: Validation & Edge Cases** - Comprehensive testing and final polish.

## Phase Details

### Phase 1: Research & Error Detection
**Goal**: Reproduce and correctly identify "High Traffic" errors from the API.
**Depends on**: Nothing (first phase)
**Requirements**: RETRY-01, RETRY-02
**Success Criteria** (what must be TRUE):
  1. The extension can distinguish between a standard 500 error and a 429 "High Traffic" error.
  2. The extension correctly identifies the "Our servers are experiencing high traffic..." message in the response body.
  3. Error detection logic is verified with a reproduction script or mock server.
**Plans**: TBD

Plans:
- [ ] 01-01: Research and reproduce the "High Traffic" error response.
- [ ] 01-02: Implement error detection logic for 429 status and response body.

### Phase 2: Exponential Backoff Core
**Goal**: Implement the retry loop with exponential backoff and attempt limits.
**Depends on**: Phase 1
**Requirements**: RETRY-03, RETRY-04
**Success Criteria** (what must be TRUE):
  1. Failed "High Traffic" requests automatically trigger a retry.
  2. Each retry wait time increases exponentially (e.g., 1s, 2s, 4s...).
  3. The system stops retrying after exactly 5 attempts and reports the final error.
**Plans**: TBD

Plans:
- [ ] 02-01: Implement the retry loop in `ReactorCore`.
- [ ] 02-02: Integrate the exponential backoff delay strategy.

### Phase 3: UI Feedback & Progress
**Goal**: Show retry status and progress in the VS Code UI.
**Depends on**: Phase 2
**Requirements**: UI-01, UI-02, UI-03
**Success Criteria** (what must be TRUE):
  1. Status bar displays "Retrying..." and the current attempt count (e.g., "2/5").
  2. User sees a visible countdown or progress bar indicating when the next retry will occur.
  3. Webview reflects the "Retrying" state with relevant details.
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 03-01: Update Status Bar with a dedicated retry state.
- [ ] 03-02: Add countdown and attempt progress display.

### Phase 4: Validation & Edge Cases
**Goal**: Final testing and ensuring robust behavior under various conditions.
**Depends on**: Phase 3
**Requirements**: (All v1 requirements)
**Success Criteria** (what must be TRUE):
  1. Retry mechanism handles successful recovery (e.g., server becomes available after 2nd retry).
  2. Retry mechanism handles total failure (all 5 attempts fail) gracefully.
  3. UI correctly cleans up after the retry cycle ends.
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 04-01: Validate full retry cycle with various success/failure scenarios.
- [ ] 04-02: Ensure smooth UI transitions and state cleanup.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Research & Error Detection | 2/2 | Completed | 2025-02-13 |
| 2. Exponential Backoff Core | 2/2 | Completed | 2025-02-13 |
| 3. UI Feedback & Progress | 2/2 | Completed | 2025-02-13 |
| 4. Validation & Edge Cases | 2/2 | Completed | 2025-02-13 |
