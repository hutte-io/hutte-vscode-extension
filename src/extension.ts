// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import { HutteOrgsProvider, HutteOrg } from './hutteOrgsProvider';
import { commandSync  } from "execa";

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	configureLoginIfRequired();
	registerSidePanelCommands();
	setPaletteCommands(context);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function setPaletteCommands(context: vscode.ExtensionContext) {
	context.subscriptions.push(loginCommand());
	context.subscriptions.push(activateFromPoolCommand());
}

function registerSidePanelCommands() {
	vscode.commands.registerCommand('hutte.signup', () => vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://app2.hutte.io/sign-up`)));
	
	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
	const hutteOrgsProvider = new HutteOrgsProvider(rootPath);
	vscode.window.createTreeView('hutteOrgs', { treeDataProvider: hutteOrgsProvider });
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
		commandSync(`sfdx hutte:org:list --json --includeauth`);
		vscode.commands.executeCommand('setContext', 'hutte.IsLogged', true);
	} catch(err){
		vscode.commands.executeCommand('setContext', 'hutte.IsLogged', false);
	}
}

function loginCommand(): vscode.Disposable {
	return vscode.commands.registerCommand('hutte.login', async () => {
		const email = await vscode.window.showInputBox({title: 'Hutte Email Address'});
		const password = await vscode.window.showInputBox({title: 'Hutte Password', password: true});

		const vscodeOutput : vscode.OutputChannel = vscode.window.createOutputChannel('Hutte');
		vscodeOutput.show();


		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Authenticating into Hutte",
			cancellable: false
		}, (progress, _) => {
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
	});
}

function activateFromPoolCommand() {
	return vscode.commands.registerCommand('hutte.activateFromPool', async () => activateFromPool());
}

async function authorizeOrg(orgName?: string) {
	const vscodeOutput : vscode.OutputChannel = vscode.window.createOutputChannel('Hutte');
	vscodeOutput.show();

	vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: "Authorizing Hutte Org",
		cancellable: false
	}, (progress, _) => {
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

	vscode.window.withProgress({
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
