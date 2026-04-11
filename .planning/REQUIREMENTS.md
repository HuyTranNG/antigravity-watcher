# Requirements: Antigravity Watcher

## 1. Functional Requirements

### 1.1 Quota Monitoring
- **FR-1**: The extension MUST fetch quota usage data from local Antigravity instances.
- **FR-2**: The extension MUST support monitoring for Gemini, Claude, GPT, and Mistral model groups.
- **FR-3**: The extension MUST display usage percentages and reset countdowns.

### 1.2 Visualizations
- **FR-4**: Provide a Webview-based dashboard in the Activity Bar.
- **FR-5**: Provide a Status Bar item with real-time health indicators (Healthy, Warning, Low, Critical).

### 1.3 Discovery & Automation
- **FR-6**: Automatically discover running Antigravity processes without manual configuration.
- **FR-7**: Support multiple Antigravity processes/accounts simultaneously.
- **FR-8**: Periodically refresh data in the background (default: every 2 minutes).

## 2. Non-Functional Requirements

### 2.1 Performance
- **NFR-1**: Data fetching and processing MUST NOT block the VS Code main thread.
- **NFR-2**: Memory usage SHOULD be minimal as it runs in the background.

### 2.2 Usability
- **NFR-3**: Zero-configuration setup for most users.
- **NFR-4**: UI SHOULD match the VS Code aesthetic (e.g., glassmorphism, native color themes).

### 2.3 Reliability
- **NFR-5**: Gracefully handle cases where Antigravity is not running or the API is unreachable.
