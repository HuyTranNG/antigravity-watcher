"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const hunter_1 = require("./hunter");
const reactor_1 = require("./reactor");
function activate(context) {
    console.log('Antigravity Watcher is now active!');
    let disposable = vscode.commands.registerCommand('antigravity-watcher.checkQuota', async () => {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Antigravity Watcher",
            cancellable: false
        }, async (progress) => {
            progress.report({ message: "Scanning for Antigravity process..." });
            const hunter = new hunter_1.ProcessHunter();
            const scanResult = await hunter.scanEnvironment(3);
            if (!scanResult) {
                vscode.window.showErrorMessage('Failed to find Antigravity process. Make sure Antigravity is running.');
                return;
            }
            progress.report({ message: "Fetching quota data..." });
            const reactor = new reactor_1.ReactorCore();
            reactor.engage(scanResult.connectPort, scanResult.csrfToken);
            try {
                const snapshot = await reactor.fetchQuotaSnapshot();
                const items = snapshot.models.map(m => {
                    const remaining = (m.remainingFraction * 100).toFixed(1);
                    return `${m.displayName}: ${remaining}% remaining (Resets: ${m.resetTime})`;
                });
                const detail = items.join('\n');
                vscode.window.showInformationMessage(`Antigravity Quota: ${snapshot.userInfo?.email || 'User'}`, { modal: true, detail });
            }
            catch (error) {
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
function deactivate() { }
//# sourceMappingURL=extension.js.map