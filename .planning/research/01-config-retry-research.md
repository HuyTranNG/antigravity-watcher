# Phase Research: Configuration Toggle & Version Upgrade

**Researched:** 2025-02-24
**Domain:** VS Code Extension Development / TypeScript
**Confidence:** HIGH

## Summary

This research identifies the implementation path for adding a user-configurable retry toggle for high-traffic errors in the Antigravity Watcher extension. The current implementation in `src/reactor.ts` uses a hardcoded exponential backoff retry mechanism (max 5 attempts). To fulfill the requirement, we need to expose a boolean setting in `package.json`, read this setting in `src/extension.ts` and `src/chartView.ts`, and pass it to the `ReactorCore` instance.

Additionally, the extension version should be upgraded from `1.0.5` to `1.0.6` following the existing patch-level versioning pattern observed in the project's history.

**Primary recommendation:** Add `antigravity-watcher.enableRetry` to `package.json` contributions, update `ReactorCore.fetchQuotaSnapshot` to accept an options object, and increment the version to `1.0.6` via `npm version patch`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| VS Code API | ^1.80.0 | Core extension framework | Required for extension functionality [VERIFIED: package.json] |
| TypeScript | ^5.0.0 | Language | Type safety and modern JS features [VERIFIED: package.json] |
| Node.js | v22.x | Runtime | Extension host environment [VERIFIED: environment audit] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| Bun | 1.3.x | Runtime/Tooling | Used for CLI execution and lock file management [VERIFIED: bun.lock] |
| npm | 11.x | Package Manager | Standard for dependency and version management [VERIFIED: environment audit] |

## Architecture Patterns

### Recommended Project Structure
- **Configuration Source**: `package.json` (declarative)
- **Configuration Access**: `vscode.workspace.getConfiguration('antigravity-watcher')`
- **Logic Injection**: Pass configuration values as arguments to the `ReactorCore` API client to keep it decoupled from the VS Code environment (allowing use in `src/index.ts` CLI tool).

### Pattern 1: Configuration Injection
**What:** Pass an options object to the API client methods instead of hardcoding behavior or reaching into global state.
**When to use:** When a low-level utility needs to adapt its behavior based on user preferences defined at the extension level.
**Example:**
```typescript
// src/reactor.ts
export interface FetchOptions {
  enableRetry?: boolean;
  onRetry?: (attempt: number, delayMs: number) => void;
}

async fetchQuotaSnapshot(options?: FetchOptions): Promise<QuotaSnapshot> {
  // Use options.enableRetry to decide whether to loop or fail immediately
}
```

### Anti-Patterns to Avoid
- **Hardcoding Settings**: Avoid using hardcoded values for features that users might want to control (like auto-retries during peak hours).
- **Direct VS Code Dependency in Reactor**: Avoid importing `vscode` directly in `src/reactor.ts`. This keeps the reactor core portable for CLI use (as seen in `src/index.ts`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Configuration Management | Custom JSON parser for settings | `vscode.workspace.getConfiguration` | Handles workspace vs user settings, caching, and overrides. |
| Version Management | Manual string replacement in all files | `npm version patch` | Updates `package.json` and syncs with lock files reliably. |

## Common Pitfalls

### Pitfall 1: Breaking Call Sites
**What goes wrong:** Changing the signature of `fetchQuotaSnapshot` from `(onRetry?)` to `(options)` breaks existing calls in `extension.ts`, `chartView.ts`, and `index.ts`.
**How to avoid:** Use an optional `FetchOptions` object and provide sensible defaults within the method. Keep the `onRetry` callback as a property of that object.

### Pitfall 2: Stale Configuration
**What goes wrong:** Reading the configuration once at activation means the extension won't react to setting changes until a reload.
**How to avoid:** Read the configuration inside the `updateStatusBar` or `updateView` loops, or listen to `vscode.workspace.onDidChangeConfiguration`.

## Code Examples

### `package.json` Contribution
```json
"configuration": {
  "properties": {
    "antigravity-watcher.enableRetry": {
      "type": "boolean",
      "default": true,
      "description": "Enable exponential backoff retry when servers are experiencing high traffic (429 Too Many Requests)."
    }
  }
}
```

### `src/reactor.ts` Update
```typescript
// Change signature to support optional toggle
async fetchQuotaSnapshot(options?: { 
  enableRetry?: boolean; 
  onRetry?: (attempt: number, delayMs: number) => void 
}): Promise<QuotaSnapshot> {
  const enableRetry = options?.enableRetry ?? true;
  const maxRetries = enableRetry ? 5 : 0;
  // ... rest of transmitWithRetry logic using maxRetries
}
```

### Version Upgrade Process
1. Update `package.json` version: `1.0.5` -> `1.0.6`.
2. Update `CHANGELOG.md` with new entry.
3. Run `bun install` to update `bun.lock`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded retry | Configurable toggle | 2025-02-24 | Better UX for users on unstable networks or high-traffic periods. |
| Positional args | Options object | — | Better extensibility for future settings (e.g., custom retry count). |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Version bump should be a patch (`1.0.6`) | Summary | Low - could be a minor bump (`1.1.0`) if preferred. |
| A2 | Users want retry enabled by default | Code Examples | Low - standard for "resilient" API clients. |

## Open Questions

1. **Retry Count?** Should we also implement `antigravity-watcher.maxRetries` (as suggested by requirement `CONF-01`)?
   - Recommendation: Start with the boolean toggle as requested, but design the `FetchOptions` to easily support a numeric count later.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Execution | ✓ | v22.21.1 | — |
| Bun | Local CLI / Lock | ✓ | 1.3.6 | npm |
| npm | Versioning | ✓ | 11.6.4 | Manual edit |
| tsc | Compilation | ✓ | npx tsc | — |

## Sources

### Primary (HIGH confidence)
- `package.json` - Current project configuration and versioning.
- `src/reactor.ts` - Implementation of retry logic.
- `CHANGELOG.md` - Project release history.
- `README.md` - Configuration documentation.

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` - Traceability for `CONF-01` and `CONF-02`.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified via project files.
- Architecture: HIGH - Standard VS Code patterns.
- Pitfalls: HIGH - Common extension development gotchas.

**Research date:** 2025-02-24
**Valid until:** 2025-03-24 (30 days)
