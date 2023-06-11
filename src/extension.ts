// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
// import { DepNodeProvider, Dependency } from './nodeDependencies';
import { HutteOrgsProvider, HutteOrg } from './hutteOrgsProvider';
import { commandSync,  } from "execa";

let myStatusBarItem: vscode.StatusBarItem;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	const hutteOrgsProvider = new HutteOrgsProvider(rootPath);
	// vscode.window.registerTreeDataProvider('nodeDependencies', nodeDependenciesProvider);
	vscode.window.createTreeView('hutteOrgs', {
		treeDataProvider: hutteOrgsProvider
	  });
	vscode.commands.registerCommand('hutteOrgs.refreshEntry', () => hutteOrgsProvider.refresh());
	// vscode.commands.registerCommand('extension.openPackageOnNpm', moduleName => vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://www.npmjs.com/package/${moduleName}`)));
	vscode.commands.registerCommand('hutteOrgs.takeFromPool', () => vscode.window.showInformationMessage(`Successfully called take from pool.`));
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

			try {
				const output = await commandSync(`sfdx hutte:auth:login --email ${email} --password ${password}`);
				if (output.stdout.includes('Hutte: Invalid Login Credentials')) {
					vscode.window.showErrorMessage(output.stdout);
					vscodeOutput.appendLine(output.stdout);
				} else {
					vscode.window.showInformationMessage('Hutte: Successfully Authorized');
					vscodeOutput.appendLine('Hutte: Successfully Authorized');
				}
			} catch (err: any) {
				vscode.window.showErrorMessage(err.message);
				vscodeOutput.appendLine(err.message);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('hutte.getOrgFromPool', async () => {
			const vscodeOutput : vscode.OutputChannel = vscode.window.createOutputChannel('Hutte');
			vscodeOutput.show();

			let output;
			try {
				output = await commandSync(`sfdx hutte:pool:take --wait --json`);
				vscode.window.showInformationMessage('Hutte: Successfully Set Org from Pool');
				vscodeOutput.appendLine('Hutte: Successfully Set Org from Pool');
			} catch(err: any) {
				vscode.window.showErrorMessage(err.message);
				vscodeOutput.appendLine(err.message);
			}

		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('hutte.getOrg', async () => {
			// @TODO: Get org name from user list selection
			authorizeOrg('');
		})
	);

	const myCommandId = 'sample.showSelectionCount';
	context.subscriptions.push(vscode.commands.registerCommand(myCommandId, (n) => {
		vscode.window.showInformationMessage(`Hutte Sample, ${n} line(s) selected... Keep going!`);
	}));

	// create a new status bar item that we can now manage
	myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	myStatusBarItem.command = myCommandId;
	context.subscriptions.push(myStatusBarItem);

	// register some listener that make sure the status bar 
	// item always up-to-date
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem));
	context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(updateStatusBarItem));

	// update status bar item once at start
	updateStatusBarItem();
}

// This method is called when your extension is deactivated
export function deactivate() {}

async function authorizeOrg(orgName?: string) {
	const vscodeOutput : vscode.OutputChannel = vscode.window.createOutputChannel('Hutte');
	vscodeOutput.show();

	let output;
	try {
		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Progress Notification",
			cancellable: false,

		}, (progress, token) => {
			progress.report({ message: 'Setting Hutte Org' });

			output = commandSync(`echo "${orgName}" | sfdx hutte:org:authorize --no-pull`, {shell: true});
			vscode.window.showInformationMessage('Hutte: Successfully Set Org');

			return Promise.resolve();
		});
		
	} catch(err: any) {
		vscode.window.showErrorMessage(err.message);
		vscodeOutput.appendLine(err.message);
	}
}

function updateStatusBarItem(): void {
	const n = getNumberOfSelectedLines(vscode.window.activeTextEditor);
	if (n > 0) {
		myStatusBarItem.text = `$(megaphone) Hutte Sample, ${n} line(s) selected`;
		myStatusBarItem.show();
	} else {
		myStatusBarItem.hide();
	}
}

function getNumberOfSelectedLines(editor: vscode.TextEditor | undefined): number {
	let lines = 0;
	if (editor) {
		lines = editor.selections.reduce((prev, curr) => prev + (curr.end.line - curr.start.line), 0);
	}
	return lines;
}
