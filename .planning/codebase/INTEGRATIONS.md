# External Integrations

**Analysis Date:** 2025-02-13

## APIs & External Services

**Local Language Server:**
- Antigravity/Codeium Language Server - The extension integrates with a locally running language server process.
  - SDK/Client: None (Uses native `https` requests).
  - Auth: CSRF Token extracted from process arguments (`--csrf_token`).
  - Discovery: Scans OS process list in `src/hunter.ts`.

## Data Storage

**Databases:**
- None.

**File Storage:**
- Local filesystem only - Scans for process info. Uses standard VS Code storage for settings.

**Caching:**
- In-memory - `QuotaSnapshot` objects are stored in memory within `ChartViewProvider` (`src/chartView.ts`) and `ReactorCore` (`src/reactor.ts`).

## Authentication & Identity

**Auth Provider:**
- Custom - Uses process-based token extraction.
  - Implementation: `ProcessHunter` in `src/hunter.ts` scans the system process list (using `ps`, `lsof`, `ss`, or `powershell`) for the language server and extracts the `--csrf_token` argument.

## Monitoring & Observability

**Error Tracking:**
- None (Uses `console.error` and VS Code output channels implicitly).

**Logs:**
- Console logging via `console.log` and `console.error`.

## CI/CD & Deployment

**Hosting:**
- VS Code Marketplace (Deployment target).

**CI Pipeline:**
- None detected in the repository (e.g., no `.github/workflows`).

## Environment Configuration

**Required env vars:**
- None (Configuration is handled via VS Code settings).

**Secrets location:**
- CSRF tokens are ephemeral and extracted at runtime from active processes.

## Webhooks & Callbacks

**Incoming:**
- None.

**Outgoing:**
- **Local API Calls:**
  - POST `127.0.0.1:[PORT]/exa.language_server_pb.LanguageServerService/GetUserStatus` - Fetches quota data.
  - POST `127.0.0.1:[PORT]/exa.unleash_pb.UnleashService/GetUnleashData` - Used for connection verification.

---

*Integration audit: 2025-02-13*
