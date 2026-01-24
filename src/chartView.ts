import * as vscode from 'vscode';
import { ProcessHunter } from './hunter';
import { ReactorCore, QuotaSnapshot } from './reactor';

interface WebviewMessage {
  type: string;
  [key: string]: any;
}

interface QuotaChartData {
  name: string;
  shortName: string;
  remaining: number;
  used: number;
  resetTime: string;
  countdown: string;
  isExhausted: boolean;
}

export class ChartViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'antigravity-watcher.chartView';
  private _view?: vscode.WebviewView;
  private _refreshInterval?: NodeJS.Timeout;
  private _latestSnapshot?: QuotaSnapshot;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getLoadingHtml();

    // Initial load
    this.updateView();

    // Set up auto-refresh
    this.startAutoRefresh();

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (data: WebviewMessage) => {
      switch (data.type) {
        case 'refresh':
          await this.updateView();
          break;
      }
    });

    // Clean up on dispose
    webviewView.onDidDispose(() => {
      this.stopAutoRefresh();
    });
  }

  private startAutoRefresh() {
    this.stopAutoRefresh();
    const config = vscode.workspace.getConfiguration('antigravity-watcher');
    const minutes = config.get<number>('refreshInterval') || 2;
    const ms = minutes * 60 * 1000;
    
    this._refreshInterval = setInterval(() => {
      this.updateView();
    }, ms);
  }

  private stopAutoRefresh() {
    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
      this._refreshInterval = undefined;
    }
  }

  public async updateView() {
    if (!this._view) {
      return;
    }

    try {
      const hunter = new ProcessHunter();
      const scanResult = await hunter.scanEnvironment(1);

      if (!scanResult) {
        this._view.webview.html = this._getErrorHtml('Antigravity not found. Please make sure Antigravity is running.');
        return;
      }

      const reactor = new ReactorCore();
      reactor.engage(scanResult.connectPort, scanResult.csrfToken);
      const snapshot = await reactor.fetchQuotaSnapshot();
      
      this._latestSnapshot = snapshot;
      this._view.webview.html = this._getHtmlForWebview(snapshot);
    } catch (error) {
      this._view.webview.html = this._getErrorHtml(`Failed to fetch quota data: ${error}`);
    }
  }

  private _getLoadingHtml(): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Antigravity Watcher</title>
      <style>
        body {
          font-family: var(--vscode-font-family);
          padding: 20px;
          color: var(--vscode-foreground);
          background-color: var(--vscode-editor-background);
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .loading {
          text-align: center;
        }
        .spinner {
          border: 3px solid var(--vscode-progressBar-background);
          border-top: 3px solid var(--vscode-progressBar-foreground);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading quota data...</p>
      </div>
    </body>
    </html>`;
  }

  private _getErrorHtml(message: string): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Antigravity Watcher</title>
      <style>
        body {
          font-family: var(--vscode-font-family);
          padding: 20px;
          color: var(--vscode-foreground);
          background-color: var(--vscode-editor-background);
        }
        .error {
          background-color: var(--vscode-inputValidation-errorBackground);
          border: 1px solid var(--vscode-inputValidation-errorBorder);
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        button {
          background-color: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-family: var(--vscode-font-family);
        }
        button:hover {
          background-color: var(--vscode-button-hoverBackground);
        }
      </style>
    </head>
    <body>
      <div class="error">
        <strong>⚠️ Error</strong>
        <p>${message}</p>
      </div>
      <button onclick="refresh()">Retry</button>
      <script>
        const vscode = acquireVsCodeApi();
        function refresh() {
          vscode.postMessage({ type: 'refresh' });
        }
      </script>
    </body>
    </html>`;
  }

  private _getHtmlForWebview(snapshot: QuotaSnapshot): string {
    const groups = snapshot.groups || [];
    
    // Prepare chart data
    const chartData: QuotaChartData[] = groups.map(g => ({
      name: g.groupName,
      shortName: g.shortName,
      remaining: g.remainingFraction * 100,
      used: (1 - g.remainingFraction) * 100,
      resetTime: g.resetTime,
      countdown: g.countdown || 'N/A',
      isExhausted: g.isExhausted
    }));

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Antigravity Watcher</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: var(--vscode-font-family);
          padding: 16px;
          color: var(--vscode-foreground);
          background-color: var(--vscode-editor-background);
        }
        .header {
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--vscode-panel-border);
        }
        .header h2 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .user-info {
          font-size: 12px;
          color: var(--vscode-descriptionForeground);
        }
        .refresh-btn {
          background-color: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-family: var(--vscode-font-family);
          font-size: 12px;
          margin-top: 8px;
          width: 100%;
        }
        .refresh-btn:hover {
          background-color: var(--vscode-button-hoverBackground);
        }
        .quota-group {
          margin-bottom: 24px;
          padding: 12px;
          background-color: var(--vscode-sideBar-background);
          border-radius: 6px;
          border: 1px solid var(--vscode-panel-border);
        }
        .group-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .group-name {
          font-weight: 600;
          font-size: 13px;
        }
        .group-percentage {
          font-size: 18px;
          font-weight: 700;
        }
        .percentage-high { color: #4caf50; }
        .percentage-medium { color: #ff9800; }
        .percentage-low { color: #f44336; }
        .percentage-exhausted { color: #f44336; font-weight: 700; }

        .chart-container {
          margin: 12px 0;
        }
        .bar-chart {
          width: 100%;
          height: 24px;
          background-color: var(--vscode-input-background);
          border-radius: 12px;
          overflow: hidden;
          position: relative;
        }
        .bar-fill {
          height: 100%;
          transition: width 0.3s ease;
          border-radius: 12px;
        }
        .bar-high { background: linear-gradient(90deg, #4caf50, #66bb6a); }
        .bar-medium { background: linear-gradient(90deg, #ff9800, #ffa726); }
        .bar-low { background: linear-gradient(90deg, #f44336, #ef5350); }
        .bar-exhausted { background: #444444; }
        .reset-info {
          margin-top: 8px;
          padding: 8px;
          background-color: var(--vscode-input-background);
          border-radius: 4px;
          font-size: 11px;
        }
        .reset-label {
          color: var(--vscode-descriptionForeground);
          margin-bottom: 4px;
        }
        .reset-time {
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .countdown {
          display: inline-block;
          padding: 2px 8px;
          background-color: var(--vscode-badge-background);
          color: var(--vscode-badge-foreground);
          border-radius: 10px;
          font-size: 10px;
          font-weight: 600;
        }
        .last-updated {
          text-align: center;
          font-size: 11px;
          color: var(--vscode-descriptionForeground);
          margin-top: 20px;
          padding-top: 12px;
          border-top: 1px solid var(--vscode-panel-border);
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>📊 Quota Usage</h2>
        <div class="user-info">${snapshot.userInfo?.email || 'User'} • ${snapshot.userInfo?.tier || 'Standard'}</div>
        <button class="refresh-btn" onclick="refresh()">🔄 Refresh</button>
      </div>

      <div class="quota-groups">
        ${chartData.map(data => {
          const percentageClass = data.isExhausted ? 'percentage-exhausted' :
                                  data.remaining > 50 ? 'percentage-high' : 
                                  data.remaining > 20 ? 'percentage-medium' : 'percentage-low';
          const barClass = data.isExhausted ? 'bar-exhausted' :
                          data.remaining > 50 ? 'bar-high' : 
                          data.remaining > 20 ? 'bar-medium' : 'bar-low';
          const displayPercentage = data.isExhausted ? 'OUT OF QUOTA' : data.remaining.toFixed(1) + '%';
          
          return `
            <div class="quota-group">
              <div class="group-header">
                <div class="group-name">${data.name}</div>
                <div class="group-percentage ${percentageClass}">${displayPercentage}</div>
              </div>
              <div class="chart-container">
                <div class="bar-chart">
                  <div class="bar-fill ${barClass}" style="width: ${data.remaining}%"></div>
                </div>
              </div>
              <div class="reset-info">
                <div class="reset-label">⏰ Resets at:</div>
                <div class="reset-time">
                  ${data.resetTime}
                  <span class="countdown">${data.countdown}</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="last-updated">
        Last updated: ${new Date().toLocaleTimeString()}
      </div>

      <script>
        const vscode = acquireVsCodeApi();
        function refresh() {
          vscode.postMessage({ type: 'refresh' });
        }
      </script>
    </body>
    </html>`;
  }

  public dispose() {
    this.stopAutoRefresh();
  }
}
