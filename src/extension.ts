// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { HutteOrgsProvider, HutteOrg } from './hutteOrgsProvider';
import { commandSync  } from "execa";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	try {
		commandSync(`sfdx hutte:org:list --json --includeauth`);
		vscode.commands.executeCommand('setContext', 'hutte.IsLogged', true);
	} catch(err){
		vscode.commands.executeCommand('setContext', 'hutte.IsLogged', false);
	}

	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	const hutteOrgsProvider = new HutteOrgsProvider(rootPath);
	// vscode.window.registerTreeDataProvider('nodeDependencies', nodeDependenciesProvider);
	vscode.window.createTreeView('hutteOrgs', {
		treeDataProvider: hutteOrgsProvider
	  });
	vscode.commands.registerCommand('hutteOrgs.refreshEntry', () => hutteOrgsProvider.refresh());
	vscode.commands.registerCommand('hutteOrgs.activateFromPool', async () => {
		await activateFromPool();
		hutteOrgsProvider.refresh();
	});
	vscode.commands.registerCommand('hutteOrgs.authorize', async (hutteOrg: HutteOrg) => await authorizeOrg(hutteOrg.label));
	vscode.commands.registerCommand('hutteOrgs.openOnHutte', hutteOrg => {
		vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://app2.hutte.io/scratch-orgs/${hutteOrg.globalId}`));
	});

	context.subscriptions.push(
		vscode.commands.registerCommand('hutte.login', async () => {
			const email = await vscode.window.showInputBox({title: 'Hutte Email Address'});
			const password = await vscode.window.showInputBox({title: 'Hutte Password', password: true});

			const vscodeOutput : vscode.OutputChannel = vscode.window.createOutputChannel('Hutte');
			vscodeOutput.show();


			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Authenticating into Hutte",
				cancellable: false
			}, (progress, token) => {
				progress.report({ message: 'Setting Hutte Org' });
				
				try {
					const output = commandSync(`sfdx hutte:auth:login --email ${email} --password ${password}`);
					if (output.stdout.includes('Invalid credentials')) {
						progress.report({message: output.stdout});
						vscodeOutput.appendLine(output.stdout);
						vscode.commands.executeCommand('setContext', 'hutte.IsLogged', false);

						return Promise.reject();
					} else {
						progress.report({message: 'Hutte: Successfully Authorized'});
						vscodeOutput.appendLine('Hutte: Successfully Authorized');
						vscode.commands.executeCommand('setContext', 'hutte.IsLogged', true);

						return Promise.resolve();
					}
				} catch (err: any) {
					vscode.window.showErrorMessage(err.message);
					vscodeOutput.appendLine(err.message);
					return Promise.reject();
				}
			});
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('hutte.activateFromPool', async () => {
			activateFromPool();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('hutte.getOrg', async () => {
			// @TODO: Get org name from user list selection
			authorizeOrg('');
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}

async function authorizeOrg(orgName?: string) {
	const vscodeOutput : vscode.OutputChannel = vscode.window.createOutputChannel('Hutte');
	vscodeOutput.show();

	await vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: "Authorizing Hutte Org",
		cancellable: false
	}, (progress, token) => {
		progress.report({ message: 'Setting Hutte Org' });
		try {
			commandSync(`echo "${orgName}" | sfdx hutte:org:authorize --no-pull`, {shell: true});
			vscode.window.showInformationMessage('Hutte: Successfully Set Org');
		} catch (err: any) {
			vscode.window.showErrorMessage(err.message);
			vscodeOutput.appendLine(err.message);
		}

		return Promise.resolve();
	});
}

async function activateFromPool() {
	const vscodeOutput : vscode.OutputChannel = vscode.window.createOutputChannel('Hutte');
	vscodeOutput.show();

	await vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: "Activating Org From Pool",
		cancellable: false
	}, (progress, token) => {
		progress.report({ message: 'Taking Hutte Org from Pool' });
		try {
			commandSync(`sfdx hutte:pool:take --wait --json`);
			vscode.window.showInformationMessage('Hutte: Successfully Activated Org from Pool');
			vscodeOutput.appendLine('Hutte: Successfully Activated Org from Pool');
		} catch(err: any) {
			vscode.window.showErrorMessage(err.message);
			vscodeOutput.appendLine(err.message);
		}

		return Promise.resolve();
	});
}
