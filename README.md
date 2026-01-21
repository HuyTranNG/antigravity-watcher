# Antigravity Watcher

A Bun-based tool to fetch Antigravity AI usage and quota information from your local Antigravity process.

## Features

- 🔍 **Auto-discovery**: Automatically finds the running Antigravity language server process
- 📊 **Quota Tracking**: Fetches real-time quota information for all available models
- 🤖 **Model Details**: Shows model capabilities (images, video, thinking support)
- 📦 **Quota Groups**: Displays grouped quotas for models sharing the same pool
- 💾 **JSON Output**: Provides structured JSON output for programmatic use

## How It Works

This tool is based on the [vscode-antigravity-cockpit](https://github.com/jlcodes99/vscode-antigravity-cockpit) extension and works by:

1. **Process Discovery**: Scans system processes to find the Antigravity language server
2. **Connection Extraction**: Extracts the local API port and CSRF token from the process
3. **API Communication**: Connects to the local Antigravity API to fetch quota data

## Prerequisites

- [Bun](https://bun.sh) installed
- Antigravity application running locally

## Installation

```bash
# Install dependencies
bun install
```

## Usage

```bash
# Run the watcher
bun start

# Or run in development mode with auto-reload
bun run dev
```

## Output Example

```
🚀 Antigravity watcher Usage Fetcher
============================

🔍 Scanning for Antigravity process...
✅ Found Antigravity process:
   Port: 42100
   PID: 12345

🔌 Connecting to Antigravity API...
✅ Successfully fetched quota data

📊 Quota Information:
====================

👤 User Info:
   Email: user@example.com
   Tier: Premium
   User ID: abc123

🤖 Model Quotas:

1. Claude Sonnet 4.5
   Model ID: MODEL_CLAUDE_4_5_SONNET
   Remaining: 85.50%
   Reset Time: 2026-01-21T12:00:00Z
   Countdown: 14h 15m
   Capabilities: Images

2. GPT-4 Turbo
   Model ID: MODEL_GPT_4_TURBO
   Remaining: 92.30%
   Reset Time: 2026-01-21T12:00:00Z
   Countdown: 14h 15m
```

## Project Structure

```
antigravity-watcher/
├── src/
│   ├── index.ts      # Main entry point
│   ├── hunter.ts     # Process discovery logic
│   └── reactor.ts    # API communication
├── package.json
├── tsconfig.json
└── README.md
```

## API Reference

### ProcessHunter

Finds the Antigravity language server process.

```typescript
const hunter = new ProcessHunter();
const result = await hunter.scanEnvironment(maxAttempts);
```

### ReactorCore

Communicates with the Antigravity API.

```typescript
const reactor = new ReactorCore();
reactor.engage(port, csrfToken);
const snapshot = await reactor.fetchQuotaSnapshot();
```

## Platform Support

- ✅ **Linux**: Fully supported
- ✅ **macOS**: Fully supported (both Intel and Apple Silicon)
- ✅ **Windows**: Fully supported (requires PowerShell)

## Troubleshooting

### "Failed to find Antigravity process"

Make sure:
- Antigravity application is running
- The language server process is active
- You have permission to list system processes

### Windows-specific Issues

On Windows, you may need to:
- Run PowerShell with appropriate execution policy
- Ensure WMI service is running: `net start winmgmt`

## Credits

Based on the excellent [vscode-antigravity-cockpit](https://github.com/jlcodes99/vscode-antigravity-cockpit) by [jlcodes99](https://github.com/jlcodes99).

## License

MIT
