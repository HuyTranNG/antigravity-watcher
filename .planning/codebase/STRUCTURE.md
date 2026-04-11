# Codebase Structure

**Analysis Date:** 2025-02-13

## Directory Layout

```
antigravity-watcher/
├── .vscode/          # VS Code-specific configurations (launch/tasks)
├── node_modules/     # Project dependencies (via npm/bun)
├── out/              # Compiled JavaScript output
├── resources/        # Static assets (icons, screenshots)
├── src/              # TypeScript source code
│   ├── chartView.ts  # Webview provider for quota charts
│   ├── extension.ts  # VS Code extension entry point
│   ├── hunter.ts     # Antigravity process discovery logic
│   ├── index.ts      # Standalone CLI entry point for diagnostics
│   └── reactor.ts    # API communication and data mapping
├── package.json      # Extension manifest and scripts
├── tsconfig.json     # TypeScript configuration
└── README.md         # Project documentation
```

## Directory Purposes

**src/:**
- Purpose: Main source code for the extension and its services.
- Contains: TypeScript files implementing core logic.
- Key files: `extension.ts`, `hunter.ts`, `reactor.ts`.

**resources/:**
- Purpose: Assets for the extension's UI.
- Contains: Icons (`.png`, `.svg`) used in the activity bar and marketplace.
- Key files: `app-icon.png`, `tab-icon.svg`.

**out/:**
- Purpose: Build output directory.
- Contains: Transpiled JavaScript files and sourcemaps.
- Generated: Yes.

**.vscode/:**
- Purpose: Development environment configuration.
- Contains: Launch configurations for debugging and tasks for compiling.

## Key File Locations

**Entry Points:**
- `src/extension.ts`: Main entry point for the VS Code extension.
- `src/index.ts`: Entry point for the standalone CLI tool.

**Configuration:**
- `package.json`: Defines extension metadata, commands, settings, and activation events.
- `tsconfig.json`: Controls how TypeScript is compiled into JavaScript.

**Core Logic:**
- `src/hunter.ts`: Responsible for discovering the Antigravity process and its credentials.
- `src/reactor.ts`: Responsible for interacting with the Antigravity service API.

**Testing:**
- (Not detected: No dedicated `test` directory or unit tests found, though `package.json` has a `test` script pointing to `out/test/runTest.js`).

## Naming Conventions

**Files:**
- camelCase for logic files (e.g., `chartView.ts`, `extension.ts`).

**Directories:**
- kebab-case or simple lowercase (e.g., `node_modules`, `resources`).

## Where to Add New Code

**New Feature (VS Code Integration):**
- Implementation: `src/extension.ts` (for commands/status bar) or a new file in `src/`.
- UI: `src/chartView.ts` (if it requires a webview update).

**New Service or API Interaction:**
- Implementation: `src/reactor.ts` (if it interacts with the Antigravity API) or a new service class in `src/`.

**Utilities:**
- Shared helpers: Add to a new file like `src/utils.ts`.

## Special Directories

**out/:**
- Purpose: Contains the compiled JS that VS Code actually runs.
- Generated: Yes (via `npm run compile`).
- Committed: No (typically ignored in `.gitignore`).

**resources/screenshots/:**
- Purpose: Contains images for the README and marketplace.
- Committed: Yes.

---

*Structure analysis: 2025-02-13*
