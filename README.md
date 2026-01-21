# Antigravity Watcher

A VS Code extension to monitor Antigravity AI usage and quota information in real-time.

## Features

- 🔍 **Auto-discovery**: Automatically finds the running Antigravity language server process
- 📊 **Quota Tracking**: Fetches real-time quota information for all available models
- 📈 **Activity Bar Charts**: Visual charts showing usage and reset times in the activity bar
- 🎯 **Status Bar Integration**: Quick glance at quota status with color-coded indicators
- 🤖 **Model Details**: Shows model capabilities (images, video, thinking support)
- 📦 **Quota Groups**: Displays grouped quotas for models sharing the same pool
- 🔄 **Auto-refresh**: Configurable automatic updates every 2 minutes (default)

## How It Works

This tool is based on the [vscode-antigravity-cockpit](https://github.com/jlcodes99/vscode-antigravity-cockpit) extension and works by:

1. **Process Discovery**: Scans system processes to find the Antigravity language server
2. **Connection Extraction**: Extracts the local API port and CSRF token from the process
3. **API Communication**: Connects to the local Antigravity API to fetch quota data

## Prerequisites

- Visual Studio Code (version 1.80.0 or higher)
- Antigravity application running locally

## Installation

### From VSIX File

```bash
# Install the extension from the .vsix file
code --install-extension antigravity-watcher-1.0.0.vsix
```

### From Source

```bash
# Install dependencies
npm install

# Compile the extension
npm run compile

# Package the extension (optional)
vsce package
```

## Usage

### Activity Bar Charts

1. Click on the **Antigravity Watcher** icon in the activity bar (left sidebar)
2. View real-time quota usage charts for all model groups
3. See reset times and countdowns for each quota
4. Click the **Refresh** button to manually update the data

### Status Bar

- The status bar (bottom) shows a quick summary of your quotas
- Color-coded indicators show quota health:
  - 🟢 Green: Healthy (>80% remaining)
  - 🟡 Yellow: Medium (30-80% remaining)
  - 🟠 Orange: Low (5-30% remaining)
  - 🔴 Red: Critical (<5% remaining)
- Click the status bar item to see detailed quota information

### Commands

- **Antigravity watcher: Check Quota** - Manually check and display quota information
- **Antigravity watcher: Open Settings** - Open extension settings

### Configuration

Open VS Code settings and search for "Antigravity Watcher" to configure:

- **Refresh Interval**: How often to update quota data (default: 2 minutes)
- **Thresholds**: Customize the percentage thresholds for different status levels
- **Icons**: Customize the icons used for different quota levels

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
│   ├── extension.ts   # Extension activation and commands
│   ├── chartView.ts   # Activity bar chart view provider
│   ├── hunter.ts      # Process discovery logic
│   ├── reactor.ts     # API communication
│   └── index.ts       # CLI entry point (optional)
├── resources/
│   └── icon.svg       # Activity bar icon
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
