import * as vscode from 'vscode';
import { commandSync  } from "execa";
import * as path from 'path';
import { getRootPath } from './utils';

export type OrgStatus = 'active' | 'terminated' | 'pool';  

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

export function getOrgs(status: OrgStatus) {
    const orgs = JSON.parse(commandSync(`sfdx hutte:org:list --json --verbose`, { cwd: getRootPath() }).stdout);
	// const orgs = JSON.parse(commandSync(`sfdx hutte:org:list --all --json --verbose`, { cwd: getRootPath() }).stdout);

    if (!orgs || !orgs.result || !orgs.result.length) {
        vscode.commands.executeCommand('setContext', 'hutte.orgsFound', false);
    } else {
        vscode.commands.executeCommand('setContext', 'hutte.orgsFound', true);
    }

    return orgs.result
			// .filter(
			// 	(hutteOrg: any) =>  (hutteOrg.pool === true && status == 'pool') || (!hutteOrg.pool && hutteOrg.status == status)
			// )
			.map(
            	(hutteOrg: any) => new HutteOrg(hutteOrg.name, hutteOrg.createdBy, hutteOrg.state, hutteOrg.globalId, {
                	command: 'activeOrgsView.openOnHutte',
                	title: 'Open on Hutte',
                	arguments: [hutteOrg]
            	}
			)
    );
}