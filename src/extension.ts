// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { commandSync } from "execa";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

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
			const vscodeOutput : vscode.OutputChannel = vscode.window.createOutputChannel('Hutte');
			vscodeOutput.show();

			let output;
			try {
				output = await commandSync(`echo | sfdx hutte:org:authorize`);
				vscode.window.showInformationMessage('Hutte: Successfully Set Org');
				vscodeOutput.appendLine('Hutte: Successfully Set Org');
			} catch(err: any) {
				vscode.window.showErrorMessage(err.message);
				vscodeOutput.appendLine(err.message);
			}
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
