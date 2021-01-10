import { exec, ExecOptions } from 'child_process';
import { promisify } from 'util';

/**
 * Execute shell command and return promise
 *
 * @param command Command to execute
 * @param options Optional execute options
 */
export const execute = (command: string, options?: ExecOptions) => {
	const execPromise = promisify(exec);
	return execPromise(command, options)
		.then((value) => value)
		.catch((err: Error) => {
			return { stdout: command, stderr: err.message };
		});
};
