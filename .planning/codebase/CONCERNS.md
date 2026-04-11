# Codebase Concerns

**Analysis Date:** 2025-02-13

## Tech Debt

**Hardcoded Model Grouping Logic:**
- Issue: Model groups (e.g., "Gemini Pro", "Gemini Flash") are dynamically built using hardcoded string matching on model names. This is brittle and will fail if model names change or new models are introduced.
- Files: `src/reactor.ts`
- Impact: Inaccurate or missing grouping in the UI when the underlying Antigravity service updates its model list.
- Fix approach: Move group definitions to a configuration file or fetch them from the server if possible.

**Redundant Process Discovery:**
- Issue: Both the status bar update and the webview provider independently scan for the Antigravity process periodically.
- Files: `src/extension.ts`, `src/chartView.ts`
- Impact: Increased CPU/resource usage due to redundant execution of shell commands (`ps`, `lsof`, `powershell`).
- Fix approach: Implement a shared "Discovery Service" or state manager that scans once and notifies observers of changes.

**Duplicate Configuration Defaults:**
- Issue: Configuration defaults (thresholds, icons) are defined in `package.json` but also hardcoded as fallbacks in multiple places in the code.
- Files: `src/extension.ts`, `src/chartView.ts`
- Impact: Inconsistent behavior if defaults are updated in one place but not the other.
- Fix approach: Use a central configuration manager that provides consistent defaults.

## Security Considerations

**Token Exposure via Command Line:**
- Risk: The extension extracts the `csrfToken` by parsing the command line of the Antigravity process. On multi-user systems, this token may be visible to other users via `ps` or other process monitoring tools.
- Files: `src/hunter.ts`
- Current mitigation: None.
- Recommendations: Investigate if the token can be shared via a more secure mechanism (e.g., a file with restricted permissions or a named pipe).

**Disabled SSL Verification:**
- Risk: The extension explicitly disables SSL certificate verification for local communication. While common for local services, it bypasses security checks.
- Files: `src/reactor.ts`, `src/hunter.ts`
- Current mitigation: Limited to `127.0.0.1`.
- Recommendations: Use a self-signed certificate with a known fingerprint if possible, or transition to a different local IPC mechanism.

## Performance Bottlenecks

**Frequent Shell Command Execution:**
- Problem: The extension executes external shell commands (`ps aux`, `lsof`, `ss`, `powershell`) to discover the Antigravity process and its listening ports every few minutes.
- Files: `src/hunter.ts`
- Cause: Reliance on system utilities for process discovery instead of a more direct API.
- Improvement path: Cache discovery results longer or use platform-specific native modules (though this adds complexity).

## Fragile Areas

**Process and Port Discovery:**
- Files: `src/hunter.ts`
- Why fragile: Parsing the output of `ps`, `lsof`, or `powershell` is highly dependent on the OS version, language/locale settings, and the presence of these tools.
- Safe modification: Any change to the command-line arguments of the Antigravity process will break discovery.
- Test coverage: No automated tests for discovery logic across different platforms.

## Test Coverage Gaps

**Lack of Automated Tests:**
- What's not tested: Core logic for process discovery (`ProcessHunter`), API communication (`ReactorCore`), and UI data processing.
- Files: Entire `src/` directory.
- Risk: Regression bugs when updating discovery logic or handling new API response formats.
- Priority: High.

## Missing Critical Features

**Global Error Handling and Logging:**
- Problem: Errors are often swallowed with a `console.error` or presented as generic error messages in the UI. There is no central logging mechanism to help diagnose issues in production.
- Blocks: Debugging user issues remotely.

---

*Concerns audit: 2025-02-13*
