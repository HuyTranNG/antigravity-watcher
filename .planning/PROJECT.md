# Antigravity Watcher

## What This Is

A VS Code extension that monitors and displays Antigravity (Codeium) model quotas and usage limits. It helps users track their remaining credits and reset times directly within their editor via the status bar and a dedicated webview.

## Core Value

Provides immediate, actionable visibility into model quotas to prevent unexpected usage limits and interruptions during coding sessions.

## Current Milestone: v1.0 Auto-retry for High Traffic Errors

**Goal:** Implement a robust auto-retry mechanism with exponential backoff and UI progress indicators for server congestion errors.

**Target features:**
- Exponential backoff strategy for retries.
- Maximum of 5 retry attempts.
- Progress bar or timer in the UI for retry status.
- Detect "high traffic" errors (HTTP 429 and text match).

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Implement exponential backoff in ReactorCore
- [ ] Add retry limit (5 attempts)
- [ ] Update UI (Status Bar/Webview) to show retry progress
- [ ] Detect "Our servers are experiencing high traffic..." error

### Out of Scope

- Retrying other error types (e.g., auth failure, 404) — [Focus on high traffic specifically for this milestone]
- Configuration UI for retry settings — [Hardcoded defaults for now to keep it simple]

## Context

- The extension interacts with a local Antigravity server (Language Server).
- Errors like "Our servers are experiencing high traffic right now, please try again in a minute" occur during peak usage.
- `src/reactor.ts` is the central API client.

## Constraints

- **Tech Stack**: TypeScript, VS Code Extension API.
- **Performance**: Retries must not block the main thread or cause extension lag.
- **Reliability**: Retries must have a hard limit to avoid infinite loops.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Exponential Backoff | Industry standard for handling rate limits/congestion. | — Pending |
| 5 Max Retries | Balanced approach between persistence and failure reporting. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2025-02-13 after initiating v1.0 milestone*
