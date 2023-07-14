// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { HutteOrgsProvider } from './hutteOrgsProvider';
import { HutteOrg, getOrgs } from './hutteOrg';
import { commandSync  } from "execa";
import { loginHutte, takeFromPool, authorizeOrg } from './commands';
import { getRootPath, getUserInfo } from './utils';
import { registerStatusBar, updateStatusBar } from './statusBar';

// This method is called when your extension is activated
export async function activate(context: vscode.ExtensionContext) {
	initVsCodeContextVars();
	isGitProjectOpened();
	isSfdxProjectOpened();
	const isLoggedIn: Boolean = await isLoggedInHutte();
	registerSidePanelCommands();
	registerStatusBar(context);
	setStatusBar(isLoggedIn);
	setPaletteCommands(context);
}

// This method is called when your extension is deactivated
export function deactivate() {}

async function setPaletteCommands(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('hutte.login', async () => await loginHutte(context))
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
	if (fs.existsSync(path.join(getRootPath()!, 'sfdx-project.json'))) {
		vscode.commands.executeCommand('setContext', 'hutte.sfdxProjectOpened', true);
	} else {
		vscode.commands.executeCommand('setContext', 'hutte.sfdxProjectOpened', false);
	}
}

function isGitProjectOpened() {
	if (fs.existsSync(path.join(getRootPath()!, '.git'))) {
		vscode.commands.executeCommand('setContext', 'hutte.gitProjectOpened', true);
	} else {
		vscode.commands.executeCommand('setContext', 'hutte.gitProjectOpened', false);
	}
}

async function isLoggedInHutte(): Promise<Boolean> {
	try {
		commandSync(`sfdx hutte:org:list --json --verbose`, { cwd: getRootPath() });
		vscode.commands.executeCommand('setContext', 'hutte.IsLogged', true);
		return true;
	} catch(err){
		vscode.commands.executeCommand('setContext', 'hutte.IsLogged', false);
		return false;
	}
}

async function setStatusBar(isLoggedIn: Boolean) {
	if (isLoggedIn) {
		updateStatusBar(await getUserInfo());
	} else {
		updateStatusBar();
	};
}
