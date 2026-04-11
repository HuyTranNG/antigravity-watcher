# Project: Antigravity Watcher

## Overview
Antigravity Watcher is a premium VS Code extension designed to provide real-time monitoring of Antigravity AI quotas and usage directly within the editor.

## Primary Goal
To provide a seamless, non-intrusive way for developers to monitor their AI model usage (Gemini, Claude, GPT, Mistral) and know exactly when their quotas will reset.

## Core Features
- **Rich Visualizations**: Real-time charts in the Activity Bar.
- **Proactive Monitoring**: Status Bar integration with color-coded health states.
- **Intelligent Automation**: Zero-config discovery of running Antigravity instances and multi-account support.
- **Auto-Update**: Background refresh of quota data.

## Tech Stack
- **Runtime**: Node.js (via VS Code)
- **Language**: TypeScript
- **Tools**: npm, VS Code Extension API
- **Key Modules**: 
  - `src/extension.ts`: Core activation logic.
  - `src/chartView.ts`: Webview provider for the dashboard.
  - `src/hunter.ts`: Process discovery engine.
  - `src/reactor.ts`: API communication layer.
