import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { commandSync } from "execa";

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

		// @TODO: Wait until extensions are loaded to query the orgs - To be tested when extension is published
		// @TODO: Handle scenario where the user is not logged into Hutte

		const orgs = this.getOrgs();
		return orgs;
	}

	private getOrgs() {
		let hutteOrgs: any;
		let orgs;
		
			const testlog = commandSync('pwd').stdout;
			console.log(testlog);
			hutteOrgs = JSON.parse(commandSync(`sfdx hutte:org:list --json --includeauth`).stdout);
	
			orgs = hutteOrgs.result.map((hutteOrg: any) => new HutteOrg(hutteOrg.name, hutteOrg.createdBy, hutteOrg.state, hutteOrg.globalId, {
				command: 'extension.openPackageOnNpm',
				title: '',
				arguments: [hutteOrg.name]
			}));
		

		return orgs;
	}
	
}

export class HutteOrg extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		private readonly createdBy: string,
		private readonly state: string,
		public readonly globalId: string,
		public readonly command?: vscode.Command
	) {
		super(label, vscode.TreeItemCollapsibleState.None);

		this.tooltip = `${this.label}-${this.createdBy}`;
		this.description = `${this.createdBy} - ${this.state}`;
		this.collapsibleState = vscode.TreeItemCollapsibleState.None;
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'org.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'org.svg')
	};

	contextValue = 'HutteOrg';
}
