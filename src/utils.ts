import * as vscode from 'vscode';

export function getRootPath(): string | undefined {
	return (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
	? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
}