import * as vscode from 'vscode';
import { ProcessHunter } from './hunter';
import { ReactorCore } from './reactor';

export function activate(context: vscode.ExtensionContext) {
  console.log('Antigravity Watcher is now active!');

  let disposable = vscode.commands.registerCommand('antigravity-watcher.checkQuota', async () => {
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Antigravity Watcher",
      cancellable: false
    }, async (progress) => {
      progress.report({ message: "Scanning for Antigravity process..." });
      
      const hunter = new ProcessHunter();
      const scanResult = await hunter.scanEnvironment(3);

      if (!scanResult) {
        vscode.window.showErrorMessage('Failed to find Antigravity process. Make sure Antigravity is running.');
        return;
      }

      progress.report({ message: "Fetching quota data..." });
      const reactor = new ReactorCore();
      reactor.engage(scanResult.connectPort, scanResult.csrfToken);

      try {
        const snapshot = await reactor.fetchQuotaSnapshot();
        
        const items = snapshot.models.map(m => {
          const remaining = (m.remainingFraction * 100).toFixed(1);
          return `${m.displayName}: ${remaining}% remaining (Resets: ${m.resetTime})`;
        });

        const detail = items.join('\n');
        
        vscode.window.showInformationMessage(
          `Antigravity Quota: ${snapshot.userInfo?.email || 'User'}`,
          { modal: true, detail }
        );

      } catch (error) {
        vscode.window.showErrorMessage(`Failed to fetch quota data: ${error}`);
      }
    });
  });

  context.subscriptions.push(disposable);
  
  // Create status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'antigravity-watcher.checkQuota';
  statusBarItem.text = '$(dashboard) Antigravity';
  statusBarItem.tooltip = 'Check Antigravity Quota';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);
}

export function deactivate() {}
