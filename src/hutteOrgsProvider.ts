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

		// @TODO: Wait until extensions are loaded to query the orgs

		// @TODO: Handle scenario where the user is not logged into Hutte

		// if (element) {
		// 	return Promise.resolve(this.getDepsInPackageJson(path.join(this.workspaceRoot, 'node_modules', element.label, 'package.json')));
		// } else {
		// 	const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
		// 	if (this.pathExists(packageJsonPath)) {
		// 		return Promise.resolve(this.getDepsInPackageJson(packageJsonPath));
		// 	} else {
		// 		vscode.window.showInformationMessage('Workspace has no package.json');
		// 		return Promise.resolve([]);
		// 	}
		// }

		const testlog = commandSync('pwd').stdout;
		console.log(testlog);
		const hutteOrgs: any = JSON.parse(commandSync(`sfdx hutte:org:list --json --includeauth`).stdout);

		const orgs = hutteOrgs.result.map((hutteOrg: any) => new HutteOrg(hutteOrg.name, hutteOrg.createdBy, hutteOrg.state, hutteOrg.globalId, {
			command: 'extension.openPackageOnNpm',
			title: '',
			arguments: [hutteOrg.name]
		}));

		return orgs;
	}

	private pathExists(p: string): boolean {
		try {
			fs.accessSync(p);
		} catch (err) {
			return false;
		}

		return true;
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
