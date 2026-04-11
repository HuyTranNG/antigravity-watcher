# Technology Stack

**Analysis Date:** 2025-02-13

## Languages

**Primary:**
- TypeScript 5.0.0 - Used for all source code (`src/`).

**Secondary:**
- JavaScript (ES6+) - Used in webview HTML templates for client-side interactions in `src/chartView.ts`.

## Runtime

**Environment:**
- VS Code Extension Host (Node.js ^18.0.0) - Primary execution environment.
- Bun - Used for local development and scripts.

**Package Manager:**
- Bun - Version managed via `bun.lock`.
- Lockfile: `bun.lock` present.

## Frameworks

**Core:**
- VS Code Extension API (^1.80.0) - Core framework for building the extension.

**Testing:**
- Not explicitly configured in `package.json` beyond a `test` script pointing to `./out/test/runTest.js`.

**Build/Dev:**
- TypeScript Compiler (`tsc`) - Transpiles TS to JS.
- ESLint - Linting tool for code quality.
- VSCE - VSCode Extension Manager for packaging and publishing.

## Key Dependencies

**Critical:**
- Node.js Built-in Modules - The project avoids external runtime dependencies by using Node.js built-ins:
  - `https` & `http`: For API communication in `src/reactor.ts` and `src/hunter.ts`.
  - `child_process`: For scanning system processes in `src/hunter.ts`.
  - `util`: For promisifying functions.

**Infrastructure:**
- `@types/vscode`: Types for VS Code API.
- `@types/node`: Types for Node.js.
- `@types/bun`: Types for Bun.

## Configuration

**Environment:**
- VS Code Workspace Settings - Configured via `package.json` contributes section. Key settings include `refreshInterval`, `thresholds`, and `icons`.

**Build:**
- `tsconfig.json`: TypeScript configuration.
- `package.json`: Extension manifest and build scripts.

## Platform Requirements

**Development:**
- Bun or Node.js
- VS Code

**Production:**
- VS Code ^1.80.0
- Supports Windows, macOS (Intel/ARM), and Linux (process scanning is platform-specific in `src/hunter.ts`).

---

*Stack analysis: 2025-02-13*
