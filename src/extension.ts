import * as vscode from 'vscode';
import { ProcessHunter } from './hunter';
import { ReactorCore } from './reactor';
import { ChartViewProvider } from './chartView';

export function activate(context: vscode.ExtensionContext) {
  console.log('Antigravity Watcher is now active!');

  // Register chart view provider
  const chartViewProvider = new ChartViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ChartViewProvider.viewType,
      chartViewProvider
    )
  );

  let disposable = vscode.commands.registerCommand('antigravity-watcher.checkQuota', async () => {
    await updateStatusBar();
    
    // Still show the detailed message when clicked
    const hunter = new ProcessHunter();
    const scanResult = await hunter.scanEnvironment(3);

    if (!scanResult) {
      vscode.window.showErrorMessage('Failed to find Antigravity process. Make sure Antigravity is running.');
      return;
    }

    const reactor = new ReactorCore();
    reactor.engage(scanResult.connectPort, scanResult.csrfToken);

    try {
      const snapshot = await reactor.fetchQuotaSnapshot();
      
      let displayItems: string[] = [];

      if (snapshot.groups && snapshot.groups.length > 0) {
        displayItems = snapshot.groups.map(g => {
          const remaining = (g.remainingFraction * 100).toFixed(1);
          // Get models in this group that actually exist in snapshot.models
          const modelsInGroup = snapshot.models
            .filter(m => g.modelIds.includes(m.modelId))
            .map(m => m.displayName)
            .join(', ');
          
          return `【${g.groupName}】\nModels: ${modelsInGroup}\nRemaining: ${remaining}%\nResets: ${g.resetTime}\n`;
        });
      } else {
        displayItems = snapshot.models.map(m => {
          const remaining = (m.remainingFraction * 100).toFixed(1);
          return `${m.displayName}: ${remaining}% remaining (Resets: ${m.resetTime})`;
        });
      }

      const detail = displayItems.join('\n');
      
      vscode.window.showInformationMessage(
        `Antigravity watcher Quota: ${snapshot.userInfo?.email || 'User'}`,
        { modal: true, detail }
      );

    } catch (error) {
      vscode.window.showErrorMessage(`Failed to fetch quota data: ${error}`);
    }
  });

  context.subscriptions.push(disposable);

  context.subscriptions.push(vscode.commands.registerCommand('antigravity-watcher.openSettings', () => {
    vscode.commands.executeCommand('workbench.action.openSettings', 'antigravity-watcher');
  }));
  
  // Create status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'antigravity-watcher.checkQuota';
  statusBarItem.text = '$(dashboard) Antigravity watcher';
  statusBarItem.tooltip = 'Check Antigravity Quota';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Helper to get status icon from settings
  function getStatusIcon(fraction: number): string {
    const config = vscode.workspace.getConfiguration('antigravity-watcher');
    const thresholds = config.get<any>('thresholds') || { high: 0.8, medium: 0.3, low: 0.05 };
    const icons = config.get<any>('icons') || { high: '🟢', medium: '🟡', low: '🟠', critical: '🔴' };

    if (fraction > (thresholds.high ?? 0.8)) return icons.high ?? '🟢';
    if (fraction > (thresholds.medium ?? 0.3)) return icons.medium ?? '🟡';
    if (fraction > (thresholds.low ?? 0.05)) return icons.low ?? '🟠';
    return icons.critical ?? '🔴';
  }

  // Function to update status bar
  async function updateStatusBar() {
    const hunter = new ProcessHunter();
    const scanResult = await hunter.scanEnvironment(1);

    if (!scanResult) {
      statusBarItem.text = '$(circle-slash) Antigravity watcher';
      statusBarItem.tooltip = 'Antigravity not found';
      statusBarItem.backgroundColor = undefined;
      return;
    }

    const reactor = new ReactorCore();
    reactor.engage(scanResult.connectPort, scanResult.csrfToken);

    try {
      const snapshot = await reactor.fetchQuotaSnapshot();
      if (snapshot.groups && snapshot.groups.length > 0) {
        statusBarItem.text = snapshot.groups
          .map(g => `${getStatusIcon(g.remainingFraction)} ${g.shortName}`)
          .join('  ');
          
        const minFraction = Math.min(...snapshot.groups.map(g => g.remainingFraction));
        const config = vscode.workspace.getConfiguration('antigravity-watcher');
        const thresholds = config.get<any>('thresholds') || { high: 0.8, medium: 0.3, low: 0.05 };

        if (minFraction < (thresholds.low ?? 0.05)) {
          statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        } else if (minFraction < (thresholds.medium ?? 0.3)) {
          statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        } else {
          statusBarItem.backgroundColor = undefined;
        }

        statusBarItem.tooltip = 'Antigravity Quotas:\n' + snapshot.groups
          .map(g => `${g.groupName}: ${(g.remainingFraction * 100).toFixed(1)}%`)
          .join('\n');
      } else {
        statusBarItem.text = '$(dashboard) Antigravity watcher';
        statusBarItem.backgroundColor = undefined;
      }
    } catch (error) {
      statusBarItem.text = '$(error) Antigravity watcher';
      statusBarItem.tooltip = `Error fetching data: ${error}`;
      statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    }
  }

  // Initial update
  updateStatusBar();

  // Periodic update management
  let refreshInterval: NodeJS.Timeout | undefined;
  
  function startTimer() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    const config = vscode.workspace.getConfiguration('antigravity-watcher');
    const minutes = config.get<number>('refreshInterval') || 2;
    const ms = minutes * 60 * 1000;
    
    refreshInterval = setInterval(updateStatusBar, ms);
  }

  startTimer();

  // Listen for config changes
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('antigravity-watcher.refreshInterval')) {
      startTimer();
    }
    if (e.affectsConfiguration('antigravity-watcher.thresholds') || e.affectsConfiguration('antigravity-watcher.icons')) {
      updateStatusBar();
    }
  }));

  context.subscriptions.push({ dispose: () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  }});
}

export function deactivate() {}
