# Phase 6: UI Resilience Controls - Context

The user wants to add user-facing controls to the UI (Status Bar and Webview) to toggle the auto-retry resilience feature. This gives the user immediate control over how the extension behaves when the Antigravity server is busy.

## Goals

1.  **Status Bar Toggle**: A clickable status bar item that shows if retry is enabled (`$(sync)`) or disabled (`$(sync-ignored)`).
2.  **Sidebar Webview Toggle**: A switch or button in the webview header that syncs with the VS Code configuration.
3.  **Reactive Updates**: UI components must update immediately when the configuration changes (either via the toggles or via the VS Code Settings UI).

## Decisions

- **D-01**: Use a second, dedicated status bar item for the retry toggle to avoid overloading the existing quota-info status bar item.
- **D-02**: Implement a `antigravity-watcher.toggleRetry` command that toggles the `antigravity-watcher.enableRetry` configuration setting.
- **D-03**: In the Webview header, add a "Retry: [On/Off]" switch or button next to the Refresh button.
- **D-04**: Use `vscode.workspace.onDidChangeConfiguration` to trigger UI updates for both status bar and webview when the setting changes.

## Deferred Ideas

- None.

## the agent's Discretion

- Choice of icons for "enabled" and "disabled" beyond the ones suggested (`$(sync)` and `$(sync-ignored)`).
- Visual styling of the toggle button in the webview header.
