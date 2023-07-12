// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { HutteOrgsProvider } from './hutteOrgsProvider';
import { HutteOrg, getOrgs } from './hutteOrg';
import { commandSync  } from "execa";
import { loginHutte, takeFromPool, authorizeOrg } from './commands';
import { getRootPath } from './utils';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	initVsCodeContextVars();
	isSfdxProjectOpened();
	isLoggedInHutte();
	registerSidePanelCommands();
	setPaletteCommands(context);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function setPaletteCommands(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('hutte.login', async () => await loginHutte())
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('hutte.refreshEmptyProject', async () => await getOrgs())
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('hutte.takeFromPool', async () => await takeFromPool())
	);
}

function registerSidePanelCommands() {
	const rootPath = getRootPath();

	const hutteOrgsProvider = new HutteOrgsProvider(rootPath);
	vscode.window.createTreeView('hutteOrgs', { treeDataProvider: hutteOrgsProvider });

	vscode.commands.registerCommand('hutte.signup', () => vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://app2.hutte.io/sign-up`)));
	vscode.commands.registerCommand('hutteOrgs.refreshEntry', () => hutteOrgsProvider.refresh());
	vscode.commands.registerCommand('hutteOrgs.takeFromPool', async () => {
		await takeFromPool();
		hutteOrgsProvider.refresh();
	});
	vscode.commands.registerCommand('hutteOrgs.authorize', async (hutteOrg: HutteOrg) => await authorizeOrg(hutteOrg.label));
	vscode.commands.registerCommand('hutteOrgs.openOnHutte', hutteOrg => {
		vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://app2.hutte.io/scratch-orgs/${hutteOrg.globalId}`));
	});
}

function initVsCodeContextVars() {
	vscode.commands.executeCommand('setContext', 'hutte.IsLogged', true);
	vscode.commands.executeCommand('setContext', 'hutte.orgsFound', true);
}

function isSfdxProjectOpened() {
	const SFDX_PROJECT_FILE = 'sfdx-project.json';
	const sfdxProjectActive: Boolean = fs.existsSync(path.join(getRootPath()!, SFDX_PROJECT_FILE));

	if (!sfdxProjectActive) {
		vscode.commands.executeCommand('setContext', 'hutte.sfdxProjectOpened', false);
	} else {
		vscode.commands.executeCommand('setContext', 'hutte.sfdxProjectOpened', true);
	}

	return sfdxProjectActive;
}

function isLoggedInHutte() {
	try {
		commandSync(`sfdx hutte:org:list --json --verbose`, { cwd: getRootPath() });
		vscode.commands.executeCommand('setContext', 'hutte.IsLogged', true);
	} catch(err){
		vscode.commands.executeCommand('setContext', 'hutte.IsLogged', false);
	}
}
