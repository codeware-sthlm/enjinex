import { ChildProcessWithoutNullStreams } from 'child_process';
import { logger } from '@tx/logger';

/**
 * Exit parent process and nginx child process when active
 * @param signal received signal
 * @param nginx nginx process stream
 */
export const exitAllProcesses = (
	signal: string,
	nginx: ChildProcessWithoutNullStreams
) => {
	logger.info(`${signal} received`);
	if (nginx?.pid && nginx?.connected) {
		logger.info(`Disconnect nginx child process...`);
		nginx.disconnect();
	}
	const exitCode = 0;
	logger.info(`Exit with code ${exitCode}`);
	process.exit(exitCode);
};
