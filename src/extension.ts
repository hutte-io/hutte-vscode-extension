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
	registerSidePanelViews();
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
		vscode.commands.registerCommand('hutte.refreshEmptyProject', async () => {
			// TODO: Simplify into 'all'
			await getOrgs('active');
			await getOrgs('terminated');
			await getOrgs('pool');
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('hutte.takeFromPool', async () => await takeFromPool())
	);
}

function registerSidePanelViews() {
	const rootPath = getRootPath();

	const activeOrgsProvider = new HutteOrgsProvider(rootPath, 'active');
	const terminatedOrgsProvider = new HutteOrgsProvider(rootPath, 'terminated');
	const poolOrgsProvider = new HutteOrgsProvider(rootPath, 'pool');

	// Active Orgs
	vscode.window.createTreeView('activeOrgsView', { treeDataProvider: activeOrgsProvider });
	vscode.commands.registerCommand('hutte.signup', () => vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://app2.hutte.io/sign-up`)));
	vscode.commands.registerCommand('activeOrgsView.refreshEntry', () => activeOrgsProvider.refresh());
	vscode.commands.registerCommand('activeOrgsView.takeFromPool', async () => {
		await takeFromPool();
		activeOrgsProvider.refresh();
		terminatedOrgsProvider.refresh();
	});
	vscode.commands.registerCommand('activeOrgsView.authorize', async (org: HutteOrg) => await authorizeOrg(org.label));
	vscode.commands.registerCommand('activeOrgsView.openOnHutte', org => {
		vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://app2.hutte.io/scratch-orgs/${org.globalId}`));
	});

	// Pool Orgs
	vscode.window.createTreeView('poolOrgsView', { treeDataProvider: poolOrgsProvider });
	vscode.commands.registerCommand('poolOrgsView.refreshEntry', () => poolOrgsProvider.refresh());
	vscode.commands.registerCommand('poolOrgsView.openOnHutte', org => {
		vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://app2.hutte.io/scratch-orgs/${org.globalId}`));
	});
	
	// Terminated Orgs
	vscode.window.createTreeView('terminatedOrgsView', { treeDataProvider: terminatedOrgsProvider });
	vscode.commands.registerCommand('terminatedOrgsView.refreshEntry', () => terminatedOrgsProvider.refresh());
	vscode.commands.registerCommand('terminatedOrgsView.openOnHutte', org => {
		vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://app2.hutte.io/scratch-orgs/${org.globalId}`));
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
