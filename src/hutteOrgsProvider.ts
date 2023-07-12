import * as vscode from 'vscode';
import { HutteOrg, getOrgs } from './hutteOrg';

export class HutteOrgsProvider implements vscode.TreeDataProvider<HutteOrg> {

	private _onDidChangeTreeData: vscode.EventEmitter<HutteOrg | undefined | void> = new vscode.EventEmitter<HutteOrg | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<HutteOrg | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string | undefined) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: HutteOrg): vscode.TreeItem {
		return element;
	}

	getChildren(element?: HutteOrg): Thenable<HutteOrg[]> {
		if (!this.workspaceRoot) {
			vscode.window.showInformationMessage('Empty workspace');
			return Promise.resolve([]);
		}

		return getOrgs();
	}	
}

