# Architecture

**Analysis Date:** 2025-02-13

## Pattern Overview

**Overall:** Service-Oriented Orchestration

**Key Characteristics:**
- **Modular Services:** Core functionality is divided into specialized services: `ProcessHunter` for discovery and `ReactorCore` for API interaction.
- **Orchestration:** `extension.ts` acts as the central coordinator, managing the lifecycle of services and UI components.
- **Provider Pattern:** Uses VS Code's provider model for extending the UI (e.g., `ChartViewProvider` for Webviews).

## Layers

**UI Layer:**
- Purpose: Provides user interface elements within VS Code.
- Location: `src/extension.ts`, `src/chartView.ts`
- Contains: Status Bar management, Command registration, Webview HTML/CSS/JS.
- Depends on: `ReactorCore`, `ProcessHunter`, `vscode` API.
- Used by: VS Code end-users.

**Service Layer:**
- Purpose: Encapsulates the core business logic and external process interaction.
- Location: `src/hunter.ts`, `src/reactor.ts`
- Contains: Process discovery logic, API client implementation, data transformation/grouping.
- Depends on: `child_process`, `https`, `util`.
- Used by: `extension.ts`, `chartView.ts`, `index.ts`.

**Data Layer:**
- Purpose: Defines the data structures used throughout the application.
- Location: `src/reactor.ts`
- Contains: Interfaces like `QuotaSnapshot`, `ModelQuotaInfo`, `UserInfo`.
- Depends on: None.
- Used by: All other layers.

## Data Flow

**Quota Update Flow:**

1. **Discovery:** `ProcessHunter` scans the system for the Antigravity language server process, extracting the PID, `extensionPort`, and `csrfToken` from command-line arguments.
2. **Verification:** `ProcessHunter` identifies the actual listening port and verifies connectivity by sending a ping request with the `csrfToken`.
3. **Engagement:** The orchestrator (`extension.ts` or `ChartViewProvider`) initializes `ReactorCore` with the discovered `port` and `token`.
4. **Fetching:** `ReactorCore` makes an HTTPS POST request to the local Antigravity server's `GetUserStatus` endpoint.
5. **Transformation:** `ReactorCore` parses the raw JSON response, calculates relative quotas (remaining fractions), computes countdowns, and groups models into logical categories (e.g., Gemini Pro, Gemini Flash).
6. **Presentation:** The resulting `QuotaSnapshot` is passed to the UI layer to update the Status Bar, show notifications, or re-render the Webview charts.

**State Management:**
- **Ephemeral State:** The extension primarily handles snapshots of data. `ChartViewProvider` maintains `_latestSnapshots` for its view.
- **Persistent Configuration:** User preferences (refresh intervals, thresholds, icons) are managed via VS Code's `workspace.getConfiguration`.

## Key Abstractions

**ProcessHunter:**
- Purpose: Abstracts the platform-specific complexities of finding and verifying the Antigravity process.
- Examples: `src/hunter.ts`
- Pattern: Strategy (Platform-specific discovery)

**ReactorCore:**
- Purpose: Abstracts the communication with the Antigravity local API and the subsequent data processing.
- Examples: `src/reactor.ts`
- Pattern: API Client / Data Mapper

**ChartViewProvider:**
- Purpose: Manages the lifecycle and rendering of the Quota Charts webview.
- Examples: `src/chartView.ts`
- Pattern: View Provider

## Entry Points

**Extension Activation:**
- Location: `src/extension.ts` (`activate` function)
- Triggers: VS Code startup (`onStartupFinished`).
- Responsibilities: Initializing services, registering commands, setting up the status bar, and starting periodic update timers.

**CLI / Standalone:**
- Location: `src/index.ts`
- Triggers: Manual execution (e.g., via `bun run src/index.ts`).
- Responsibilities: Providing a diagnostic tool to verify discovery and data fetching logic outside of VS Code.

## Error Handling

**Strategy:** Graceful degradation with user notification.

**Patterns:**
- **Try-Catch Blocks:** Extensively used in `extension.ts` and `chartView.ts` to catch service failures and display error messages (Status bar icons change, error Webview HTML is shown).
- **Connection Retries:** `ProcessHunter.scanEnvironment` implements a configurable number of attempts.
- **Validation:** `ReactorCore` validates the presence of a port/token before transmitting and handles empty/invalid JSON responses.

## Cross-Cutting Concerns

**Logging:** Uses `console.log` and `console.error` for internal tracking; uses `vscode.window.showErrorMessage` for user-facing errors.
**Validation:** Validates configuration values and API responses.
**Authentication:** Uses CSRF tokens extracted from the target process's command line for all API requests.

---

*Architecture analysis: 2025-02-13*
