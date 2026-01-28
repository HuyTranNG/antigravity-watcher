import * as vscode from 'vscode';
import { ProcessHunter } from './hunter';
import { ReactorCore } from './reactor';
import { ChartViewProvider } from './chartView';

interface QuotaThresholds {
  high: number;
  medium: number;
  low: number;
  exhausted: number;
}

interface QuotaIcons {
  high: string;
  medium: string;
  low: string;
  critical: string;
  exhausted: string;
}

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
    try {
      await updateStatusBar();
      
      const hunter = new ProcessHunter();
      const scanResults = await hunter.scanEnvironment(3);

      if (scanResults.length === 0) {
        vscode.window.showErrorMessage('Failed to find any Antigravity process. Make sure Antigravity is running.');
        return;
      }

      const allItems: string[] = [];

      if (scanResults.length > 0) {
        const scanResult = scanResults[0];
        const reactor = new ReactorCore();
        reactor.engage(scanResult.connectPort, scanResult.csrfToken);

        try {
          const snapshot = await reactor.fetchQuotaSnapshot();
          const accountHeader = `--- Account: ${snapshot.userInfo?.email || 'Unknown'} (${snapshot.userInfo?.tier || 'Standard'}) ---`;
          allItems.push(accountHeader);

          let displayItems: string[] = [];

          if (snapshot.groups && snapshot.groups.length > 0) {
            displayItems = snapshot.groups.map(g => {
              const remaining = (g.remainingFraction * 100).toFixed(1);
              return `【${g.groupName}】\nRemaining: ${remaining}%\nResets: ${g.resetTime}\n`;
            });
          } else {
            displayItems = snapshot.models.map(m => {
              const remaining = (m.remainingFraction * 100).toFixed(1);
              return `${m.displayName}: ${remaining}% remaining (Resets: ${m.resetTime})`;
            });
          }

          allItems.push(...displayItems);
          allItems.push('\n');

        } catch (error) {
          allItems.push(`Failed to fetch quota data for an account: ${error}`);
        }
      }

      const detail = allItems.join('\n');
      
      vscode.window.showInformationMessage(
        `Antigravity watcher Quota (Found ${scanResults.length > 0 ? 1 : 0} account)`,
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
    const thresholds = config.get<QuotaThresholds>('thresholds') || { high: 0.8, medium: 0.3, low: 0.05, exhausted: 0 };
    const icons = config.get<QuotaIcons>('icons') || { high: '🟢', medium: '🟡', low: '🟠', critical: '🔴', exhausted: '⚠️' };

    if (fraction <= (thresholds.exhausted ?? 0)) return icons.exhausted ?? '⚠️';
    if (fraction > (thresholds.high ?? 0.8)) return icons.high ?? '🟢';
    if (fraction > (thresholds.medium ?? 0.3)) return icons.medium ?? '🟡';
    if (fraction > (thresholds.low ?? 0.05)) return icons.low ?? '🟠';
    return icons.critical ?? '🔴';
  }

  // Function to update status bar
  async function updateStatusBar() {
    const hunter = new ProcessHunter();
    const scanResults = await hunter.scanEnvironment(1);

    if (scanResults.length === 0) {
      statusBarItem.text = '$(circle-slash) Antigravity watcher';
      statusBarItem.tooltip = 'Antigravity not found';
      statusBarItem.backgroundColor = undefined;
      chartViewProvider.setBadge(undefined);
      return;
    }

    const statusBarParts: string[] = [];
    const tooltipMarkdown = new vscode.MarkdownString('', true);
    tooltipMarkdown.isTrusted = true;
    tooltipMarkdown.supportThemeIcons = true;

    let worstStatusLevel = 0; // 0: high, 1: medium, 2: low, 3: critical, 4: exhausted
    const levelToName: Record<number, string> = { 0: 'high', 1: 'medium', 2: 'low', 3: 'critical', 4: 'exhausted' };

    if (scanResults.length > 0) {
      const scanResult = scanResults[0];
      const reactor = new ReactorCore();
      reactor.engage(scanResult.connectPort, scanResult.csrfToken);

      try {
        const snapshot = await reactor.fetchQuotaSnapshot();
        if (snapshot.groups && snapshot.groups.length > 0) {
          const groupIcons = snapshot.groups
            .map(g => {
              const fraction = g.remainingFraction;
              const config = vscode.workspace.getConfiguration('antigravity-watcher');
              const thresholds = config.get<QuotaThresholds>('thresholds') || { high: 0.8, medium: 0.3, low: 0.05, exhausted: 0 };
              
              let currentLevel = 3; // critical by default
              if (fraction <= (thresholds.exhausted ?? 0)) currentLevel = 4;
              else if (fraction > (thresholds.high ?? 0.8)) currentLevel = 0;
              else if (fraction > (thresholds.medium ?? 0.3)) currentLevel = 1;
              else if (fraction > (thresholds.low ?? 0.05)) currentLevel = 2;

              if (currentLevel > worstStatusLevel) {
                worstStatusLevel = currentLevel;
              }

              return `${getStatusIcon(fraction)}${g.shortName}`;
            })
            .join(' ');
          
          statusBarParts.push(groupIcons);
            
          tooltipMarkdown.appendMarkdown(`### Account: ${snapshot.userInfo?.email || 'Unknown'} (${snapshot.userInfo?.tier || 'Standard'})\n`);
          snapshot.groups.forEach(g => {
            const icon = getStatusIcon(g.remainingFraction);
            const percentage = (g.remainingFraction * 100).toFixed(1);
            tooltipMarkdown.appendMarkdown(`- ${icon} **${g.groupName}**: ${percentage}%  \n    *Resets at: ${g.resetTime}*  \n`);
            if (g.countdown) {
              tooltipMarkdown.appendMarkdown(`    *Countdown: ${g.countdown}*  \n`);
            }
          });
          tooltipMarkdown.appendMarkdown('\n---\n\n');
        }
      } catch (error) {
        console.error(`Failed to fetch data for pid ${scanResult.pid}:`, error);
      }
    }

    if (statusBarParts.length > 0) {
      statusBarItem.text = statusBarParts.join(' | ');
      statusBarItem.tooltip = tooltipMarkdown;
      
      const worstStatus = levelToName[worstStatusLevel];

      // Set background color based on worst status
      if (worstStatusLevel === 4 || worstStatusLevel === 2) { // exhausted or low
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      } else if (worstStatusLevel === 3) { // critical
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
      } else {
        statusBarItem.backgroundColor = undefined;
      }

      // Update badge for activity bar "tab"
      if (worstStatusLevel >= 3) { // exhausted or critical
        chartViewProvider.setBadge({ value: 1, tooltip: `Quota ${worstStatus}` });
      } else if (worstStatusLevel === 2) { // low
        chartViewProvider.setBadge({ value: 1, tooltip: 'Low Quota' });
      } else {
        chartViewProvider.setBadge(undefined);
      }
    } else {
      statusBarItem.text = '$(dashboard) Antigravity watcher';
      statusBarItem.tooltip = 'Found Antigravity but failed to fetch data';
      statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
      chartViewProvider.setBadge(undefined);
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
