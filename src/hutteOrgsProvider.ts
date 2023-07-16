import * as vscode from 'vscode';
import { HutteOrg, OrgStatus, getOrgs } from './hutteOrg';

export class HutteOrgsProvider implements vscode.TreeDataProvider<HutteOrg> {

	private _onDidChangeTreeData: vscode.EventEmitter<HutteOrg | undefined | void> = new vscode.EventEmitter<HutteOrg | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<HutteOrg | undefined | void> = this._onDidChangeTreeData.event;

	private _orgStatus: OrgStatus;

	constructor(private workspaceRoot: string | undefined, orgStatus: OrgStatus) {
		this._orgStatus = orgStatus;
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

		return getOrgs(this._orgStatus);
	}	
}

