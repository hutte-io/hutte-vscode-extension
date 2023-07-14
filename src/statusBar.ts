import * as vscode from 'vscode';
import { IUserInfo } from './utils';

let statusBar: vscode.StatusBarItem;

export function registerStatusBar(context: vscode.ExtensionContext): vscode.StatusBarItem {
	statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 48);
	statusBar.command = 'hutte.login';
	context.subscriptions.push(statusBar);

    return statusBar;
}

export function updateStatusBar(userInfo?: IUserInfo) {
    statusBar.text = userInfo ? `Hutte: ${userInfo.email}` : 'Hutte: Login';
	statusBar.show();
}