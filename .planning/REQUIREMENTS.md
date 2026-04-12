# Requirements: Antigravity Watcher

**Defined:** 2025-02-13
**Core Value:** Provides immediate, actionable visibility into model quotas to prevent unexpected usage limits.

## v1 Requirements (Milestone v1.0)

### API Reliability

- [x] **RETRY-01**: Detect "High Traffic" error via HTTP 429 status code.
- [x] **RETRY-02**: Detect "High Traffic" error via text match in response body: "Our servers are experiencing high traffic right now, please try again in a minute".
- [x] **RETRY-03**: Implement exponential backoff (e.g., 2^n * 1000ms) for retries.
- [x] **RETRY-04**: Limit retry attempts to exactly 5 before reporting a final failure.

### UI / UX

- [x] **UI-01**: Display a countdown or progress indicator when a retry is in progress.
- [x] **UI-02**: Show a distinct "Retrying..." state in the Status Bar.
- [x] **UI-03**: Allow the user to see how many retry attempts have been made.
- [x] **UI-06-01**: Provide a clickable Status Bar icon to toggle retry feature.
- [ ] **UI-06-02**: Provide a toggle in the sidebar Webview to enable/disable retry feature.

## v2 Requirements

### Configuration

- [ ] **CONF-01**: Allow user to configure max retry count in settings.
- [x] **CONF-02**: Allow user to disable auto-retry.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Retrying 401/403 errors | These require token refresh or re-auth, not just waiting. |
| Global Rate Limiting | The server already handles this; we only handle its feedback. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| RETRY-01 | Phase 1 | Completed |
| RETRY-02 | Phase 1 | Completed |
| RETRY-03 | Phase 2 | Completed |
| RETRY-04 | Phase 2 | Completed |
| UI-01 | Phase 3 | Completed |
| UI-02 | Phase 3 | Completed |
| UI-03 | Phase 3 | Completed |
| CONF-02 | Phase 5 | Completed |
| UI-06-01 | Phase 6 | Completed |
| UI-06-02 | Phase 6 | In Progress |

**Coverage:**
- v1 requirements: 7 total
- Mapped to phases: 7
- Unmapped: 0 ✓

---
*Requirements defined: 2025-02-13*
*Last updated: 2026-04-11 after Phase 5 completion*
