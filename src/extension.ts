// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import { HutteOrgsProvider, HutteOrg } from './hutteOrgsProvider';
import { commandSync  } from "execa";
import { loginHutte, activateFromPool, authorizeOrg } from './commands';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	configureLoginIfRequired();
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
		vscode.commands.registerCommand('hutte.activateFromPool', async () => await activateFromPool())
	);
}

function registerSidePanelCommands() {
	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	const hutteOrgsProvider = new HutteOrgsProvider(rootPath);
	vscode.window.createTreeView('hutteOrgs', { treeDataProvider: hutteOrgsProvider });

	vscode.commands.registerCommand('hutte.signup', () => vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://app2.hutte.io/sign-up`)));
	vscode.commands.registerCommand('hutteOrgs.refreshEntry', () => hutteOrgsProvider.refresh());
	vscode.commands.registerCommand('hutteOrgs.activateFromPool', async () => {
		await activateFromPool();
		hutteOrgsProvider.refresh();
	});
	vscode.commands.registerCommand('hutteOrgs.authorize', async (hutteOrg: HutteOrg) => await authorizeOrg(hutteOrg.label));
	vscode.commands.registerCommand('hutteOrgs.openOnHutte', hutteOrg => {
		vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://app2.hutte.io/scratch-orgs/${hutteOrg.globalId}`));
	});
}

function configureLoginIfRequired() {
	try {
		commandSync(`sfdx hutte:org:list --json --verbose`);
		vscode.commands.executeCommand('setContext', 'hutte.IsLogged', true);
	} catch(err){
		vscode.commands.executeCommand('setContext', 'hutte.IsLogged', false);
	}
}
