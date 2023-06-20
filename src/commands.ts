import * as vscode from 'vscode';
import { commandSync  } from "execa";

export async function loginHutte() {
    const email = await vscode.window.showInputBox({title: 'Hutte Email Address'});
    const password = await vscode.window.showInputBox({title: 'Hutte Password', password: true});

    const vscodeOutput : vscode.OutputChannel = vscode.window.createOutputChannel('Hutte');
    vscodeOutput.show();

    await vscode.window.withProgress({
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
        };
    });
}

export async function activateFromPool() {
	const vscodeOutput : vscode.OutputChannel = vscode.window.createOutputChannel('Hutte');
	vscodeOutput.show();

	await vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: "Activating Org From Pool",
		cancellable: false
	}, (progress, _) => {
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

export async function authorizeOrg(orgName?: string) {
	const vscodeOutput : vscode.OutputChannel = vscode.window.createOutputChannel('Hutte');
	vscodeOutput.show();

	await vscode.window.withProgress({
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