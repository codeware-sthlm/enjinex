import { ChildProcessWithoutNullStreams } from 'child_process';

/**
 * Exit parent process and nginx child process when active
 * @param signal received signal
 * @param nginx nginx process stream
 */
export const exitAllProcesses = (
	signal: string,
	nginx: ChildProcessWithoutNullStreams
) => {
	console.log(`[init] ${signal} received`);
	if (nginx?.pid && nginx?.connected) {
		console.log(`[init] Disconnect nginx child process...`);
		nginx.disconnect();
	}
	const exitCode = 0;
	console.log(`[init] Exit with code ${exitCode}`);
	process.exit(exitCode);
};
