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
  private _latestSnapshots: QuotaSnapshot[] = [];

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public setBadge(badge: vscode.ViewBadge | undefined) {
    if (this._view) {
      this._view.badge = badge;
    }
  }


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
      const scanResults = await hunter.scanEnvironment(1);

      if (scanResults.length === 0) {
        this._view.webview.html = this._getErrorHtml('Antigravity not found. Please make sure Antigravity is running.');
        return;
      }

      const snapshots: QuotaSnapshot[] = [];
      for (const scanResult of scanResults) {
        const reactor = new ReactorCore();
        reactor.engage(scanResult.connectPort, scanResult.csrfToken);
        try {
          const snapshot = await reactor.fetchQuotaSnapshot();
          snapshots.push(snapshot);
        } catch (error) {
          console.error(`Failed to fetch quota for pid ${scanResult.pid}:`, error);
        }
      }
      
      this._latestSnapshots = snapshots;
      this._view.webview.html = this._getHtmlForWebview(snapshots);
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

  private _getHtmlForWebview(snapshots: QuotaSnapshot[]): string {
    const config = vscode.workspace.getConfiguration('antigravity-watcher');
    const thresholds = config.get<any>('thresholds') || { high: 0.8, medium: 0.3, low: 0.05, exhausted: 0 };

    const sections = snapshots.map(snapshot => {
      const groups = snapshot.groups || [];
      const chartData: QuotaChartData[] = groups.map(g => ({
        name: g.groupName,
        shortName: g.shortName,
        remaining: g.remainingFraction * 100,
        used: (1 - g.remainingFraction) * 100,
        resetTime: g.resetTime,
        countdown: g.countdown || 'N/A',
        isExhausted: g.isExhausted
      }));

      return `
        <div class="account-section">
          <div class="user-info">
            <strong>${snapshot.userInfo?.email || 'Unknown'}</strong> • ${snapshot.userInfo?.tier || 'Standard'}
          </div>
          <div class="quota-groups">
            ${chartData.map(data => {
              const fraction = data.remaining / 100;
              let percentageClass = 'percentage-high';
              let barClass = 'bar-high';
              let displayPercentage = data.remaining.toFixed(1) + '%';

              if (fraction <= (thresholds.exhausted ?? 0)) {
                percentageClass = 'percentage-exhausted';
                barClass = 'bar-exhausted';
                displayPercentage = 'OUT OF QUOTA';
              } else if (fraction > (thresholds.high ?? 0.8)) {
                percentageClass = 'percentage-high';
                barClass = 'bar-high';
              } else if (fraction > (thresholds.medium ?? 0.3)) {
                percentageClass = 'percentage-medium';
                barClass = 'bar-medium';
              } else if (fraction > (thresholds.low ?? 0.05)) {
                percentageClass = 'percentage-low';
                barClass = 'bar-low';
              } else {
                percentageClass = 'percentage-critical';
                barClass = 'bar-critical';
              }
              
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

        </div>
      `;
    }).join('<hr class="account-separator">');

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Antigravity Watcher</title>
      <style>
        :root {
          --threshold-high: ${thresholds.high * 100};
          --threshold-medium: ${thresholds.medium * 100};
          --threshold-low: ${thresholds.low * 100};
          --threshold-exhausted: ${thresholds.exhausted * 100};
        }
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
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header h2 {
          font-size: 16px;
          font-weight: 600;
        }
        .refresh-btn {
          background-color: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-family: var(--vscode-font-family);
          font-size: 11px;
        }
        .refresh-btn:hover {
          background-color: var(--vscode-button-hoverBackground);
        }
        .account-section {
          margin-bottom: 24px;
        }
        .account-separator {
          border: 0;
          border-top: 1px solid var(--vscode-panel-border);
          margin: 24px 0;
        }
        .user-info {
          font-size: 12px;
          margin-bottom: 12px;
          color: var(--vscode-descriptionForeground);
          background-color: var(--vscode-editor-background);
          padding: 4px 8px;
          border-radius: 4px;
          border-left: 3px solid var(--vscode-button-background);
        }
        .quota-group {
          margin-bottom: 16px;
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
          font-size: 12px;
        }
        .group-percentage {
          font-size: 14px;
          font-weight: 700;
        }
        .percentage-high { color: #4caf50; }
        .percentage-medium { color: #ff9800; }
        .percentage-low { color: #ff5722; }
        .percentage-critical { color: #f44336; }
        .percentage-exhausted { color: #666666; font-weight: 700; }


        .chart-container {
          margin: 8px 0;
        }
        .bar-chart {
          width: 100%;
          height: 12px;
          background-color: var(--vscode-input-background);
          border-radius: 6px;
          overflow: hidden;
          position: relative;
        }
        .bar-fill {
          height: 100%;
          transition: width 0.3s ease;
        }
        .bar-high { background-color: #4caf50; }
        .bar-medium { background-color: #ff9800; }
        .bar-low { background-color: #ff5722; }
        .bar-critical { background-color: #f44336; }
        .bar-exhausted { background-color: #666666; }

        
        .reset-info {
          margin-top: 8px;
          font-size: 10px;
        }
        .reset-label {
          color: var(--vscode-descriptionForeground);
        }
        .reset-time {
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
        }
        .countdown {
          display: inline-block;
          padding: 1px 4px;
          background-color: var(--vscode-badge-background);
          color: var(--vscode-badge-foreground);
          border-radius: 4px;
          font-size: 9px;
        }
        .last-updated {
          text-align: center;
          font-size: 10px;
          color: var(--vscode-descriptionForeground);
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid var(--vscode-panel-border);
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>📊 Quotas</h2>
        <button class="refresh-btn" onclick="refresh()">🔄 Refresh</button>
      </div>

      <div class="content">
        ${sections}
      </div>

      <div class="last-updated">
        Updated: ${new Date().toLocaleTimeString()}
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
