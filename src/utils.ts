import * as vscode from 'vscode';
import { safeLoad } from 'js-yaml';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join as joinPath } from 'path';

export function getRootPath(): string | undefined {
	return (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
	? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
}

const CONFIG_FILE_DIR = joinPath(homedir(), '.hutte');
const CONFIG_FILE_PATH = joinPath(CONFIG_FILE_DIR, 'config.yml');

export interface IUserInfo {
	email: string;
	userId: string;
}

export function getUserInfo(): Promise<IUserInfo> {
	return new Promise<IUserInfo>((resolve, reject) => {
		try {
		  const configFile = readFileSync(CONFIG_FILE_PATH);
		  const config = safeLoad(configFile.toString()) as {
			current_user: {
			  email: string;
			  id: string;
			};
		  };
		  resolve({
			email: config.current_user.email,
			userId: config.current_user.id,
		  });
		} catch {
		  reject(
			'You need to authorize the client before. Run `$ sf hutte auth login -h` for more information.',
		  );
		}
	});
}