## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2025-02-13 — Milestone v1.0 started

## Accumulated Context

### Architectural Context
- **ReactorCore (`src/reactor.ts`)**: Handles HTTPS POST requests to the local Antigravity server. Uses `https` module.
- **Orchestration (`src/extension.ts`)**: Manages the lifecycle and UI updates.
- **Discovery (`src/hunter.ts`)**: Finds the Antigravity process and port.

### Integration Context
- Endpoint: `/exa.language_server_pb.LanguageServerService/GetUserStatus`
- Headers: `X-Codeium-Csrf-Token`, `Connect-Protocol-Version`.
- Localhost only (127.0.0.1).
