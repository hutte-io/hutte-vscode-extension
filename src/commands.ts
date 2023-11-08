import * as vscode from 'vscode';
import { commandSync  } from "execa";
import { getRootPath, getUserInfo } from './utils';
import { execSync } from 'child_process';
import { updateStatusBar } from './statusBar';

export async function loginHutte(context: vscode.ExtensionContext) {
    const email = await vscode.window.showInputBox({title: 'Hutte Email Address', ignoreFocusOut: true});
    const password = await vscode.window.showInputBox({title: 'Hutte Password', password: true, ignoreFocusOut: true });

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Hutte: Logging",
        cancellable: false
    }, async () => {        
        try {
            const output = commandSync(`sfdx hutte:auth:login --email ${email} --password ${password}`, { cwd: getRootPath() });
            if (output.stdout.includes('Invalid credentials')) {
                throw new Error(output.stdout);
            } else {
                vscode.commands.executeCommand('setContext', 'hutte.IsLogged', true);
				vscode.window.showInformationMessage('Hutte: Successfully logged in');
				updateStatusBar(await getUserInfo());
            }
        } catch (err: any) {
            vscode.window.showErrorMessage('Hutte Error: ' + err.message);
        };

		return Promise.resolve();
    });
}

export async function takeFromPool() {
	const poolName = await vscode.window.showInputBox({title: 'Set Org Name (If empty, the default name will be set)', ignoreFocusOut: true });
	const takeFromPoolCommand = poolName ? 
		`sfdx hutte:pool:take --name ${poolName} --wait --json`
		:
		`sfdx hutte:pool:take --wait --json`;

	await vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: "Hutte: Taking Org from Pool",
		cancellable: false,
	}, () => {
		try {
			commandSync(takeFromPoolCommand, { cwd: getRootPath() });
			vscode.window.showInformationMessage('Hutte: Successfully Taken Org from Pool');
		} catch(err: any) {
			vscode.window.showErrorMessage('Hutte Error: ' + err.message);
		}

		return Promise.resolve();
	});
}

export async function authorizeOrg(orgName?: string) {
	await vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: "Hutte: Setting Org as Default & Switching to the Org's Git Branch",
		cancellable: false
	}, () => {
		try {			
			execSync(String.raw`sf hutte org authorize --no-pull --org-name ${orgName}`, { cwd: getRootPath() }).toString();
			vscode.window.showInformationMessage('Hutte: Successfully Set Org as Default');
		} catch (err: any) {
			vscode.window.showErrorMessage('Hutte Error: ' + err.message);
		}

		return Promise.resolve();
	});
}