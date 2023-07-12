import * as vscode from 'vscode';
import { commandSync  } from "execa";
import * as path from 'path';
import { getRootPath } from './utils';

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

export function getOrgs() {
    const hutteOrgs = JSON.parse(commandSync(`sfdx hutte:org:list --json --verbose`, { cwd: getRootPath() }).stdout);

    if (hutteOrgs.result.length) {
        vscode.commands.executeCommand('setContext', 'hutte.orgsFound', true);
    } else {
        vscode.commands.executeCommand('setContext', 'hutte.orgsFound', false);
    }

    return hutteOrgs.result.map(
            (hutteOrg: any) => new HutteOrg(hutteOrg.name, hutteOrg.createdBy, hutteOrg.state, hutteOrg.globalId, {
                command: 'hutteOrgs.openOnHutte',
                title: 'Open on Hutte',
                arguments: [hutteOrg]
            })
    );
}