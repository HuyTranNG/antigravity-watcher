# Coding Conventions

**Analysis Date:** 2025-04-11

## Naming Patterns

**Files:**
- Use `camelCase.ts` for all source files.
  - Examples: `src/extension.ts`, `src/chartView.ts`, `src/hunter.ts`.

**Classes:**
- Use `PascalCase` for class names.
  - Examples: `ChartViewProvider`, `ProcessHunter`, `ReactorCore`.

**Functions:**
- Use `camelCase` for function and method names.
  - Examples: `activate`, `updateStatusBar`, `fetchQuotaSnapshot`, `scanEnvironment`.

**Variables:**
- Use `camelCase` for variable names.
  - Examples: `statusBarItem`, `scanResults`, `chartViewProvider`.

**Interfaces:**
- Use `PascalCase` for interface names.
  - Examples: `QuotaSnapshot`, `UserInfo`, `ModelQuotaInfo`.

## Code Style

**Formatting:**
- **Indentation:** 2 spaces.
- **Quotes:** Single quotes for strings (`'...'`).
- **Semicolons:** Required at the end of statements.
- **Trailing Commas:** Used in multi-line objects and arrays.

**Linting:**
- **Tool:** ESLint (via `eslint` package).
- **Configuration:** No `.eslintrc` file found; defaults or built-in IDE rules are likely used.
- **Scripts:** `npm run lint` targets the `src` directory with `--ext ts`.

## Import Organization

**Order:**
1. Built-in modules (e.g., `child_process`, `util`).
2. VSCode API (`vscode`).
3. Local source files.

**Path Aliases:**
- Not detected. Relative imports are used (e.g., `import { ProcessHunter } from './hunter';`).

## Error Handling

**Patterns:**
- Use `try-catch` blocks for operations that involve external interactions (I/O, network).
- Log errors to `console.error` for debugging.
- Use `vscode.window.showErrorMessage` to report critical errors to the user.
- UI-level error handling often includes fallback states (e.g., updating the status bar text or tooltip to indicate failure).

## Logging

**Framework:** `console` for extension host logs; `vscode.window.showInformationMessage` for user-visible notifications.

**Patterns:**
- `console.log` for successful lifecycle events (e.g., extension activation).
- `console.error` for failed operations.

## Comments

**When to Comment:**
- Use JSDoc-style comments for classes and key methods.
- Brief inline comments for complex logic or configuration lookups.

**JSDoc/TSDoc:**
- Observed at the top of files and for class definitions.

## Function Design

**Size:** Generally focused; functions and methods are typically under 100 lines, although some UI-heavy functions are longer.

**Parameters:** Named parameters or interface-based options are preferred for complex configuration.

**Return Values:** Explicitly typed, often using `Promise<T>` for asynchronous operations.

## Module Design

**Exports:**
- Named exports are used for all classes, interfaces, and functions.
- Examples: `export class ReactorCore`, `export interface UserInfo`.

**Barrel Files:**
- Not used; direct imports from file modules are preferred.

---

*Convention analysis: 2025-04-11*
