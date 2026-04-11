# Requirements: Antigravity Watcher

**Defined:** 2025-02-13
**Core Value:** Provides immediate, actionable visibility into model quotas to prevent unexpected usage limits.

## v1 Requirements (Milestone v1.0)

### API Reliability

- [ ] **RETRY-01**: Detect "High Traffic" error via HTTP 429 status code.
- [ ] **RETRY-02**: Detect "High Traffic" error via text match in response body: "Our servers are experiencing high traffic right now, please try again in a minute".
- [ ] **RETRY-03**: Implement exponential backoff (e.g., 2^n * 1000ms) for retries.
- [ ] **RETRY-04**: Limit retry attempts to exactly 5 before reporting a final failure.

### UI / UX

- [ ] **UI-01**: Display a countdown or progress indicator when a retry is in progress.
- [ ] **UI-02**: Show a distinct "Retrying..." state in the Status Bar.
- [ ] **UI-03**: Allow the user to see how many retry attempts have been made.

## v2 Requirements

### Configuration

- **CONF-01**: Allow user to configure max retry count in settings.
- **CONF-02**: Allow user to disable auto-retry.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Retrying 401/403 errors | These require token refresh or re-auth, not just waiting. |
| Global Rate Limiting | The server already handles this; we only handle its feedback. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| RETRY-01 | TBD | Pending |
| RETRY-02 | TBD | Pending |
| RETRY-03 | TBD | Pending |
| RETRY-04 | TBD | Pending |
| UI-01 | TBD | Pending |
| UI-02 | TBD | Pending |
| UI-03 | TBD | Pending |

**Coverage:**
- v1 requirements: 7 total
- Mapped to phases: 0
- Unmapped: 7 ⚠️

---
*Requirements defined: 2025-02-13*
*Last updated: 2025-02-13 after initiating v1.0 milestone*
