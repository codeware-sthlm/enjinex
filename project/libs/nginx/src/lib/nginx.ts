import { spawn, spawnSync } from 'child_process';
import { logger } from '@tx/logger';

/**
 * Spawn `nginx` as child process and setup listeners on
 * - stdout
 * - stderr
 * - close
 * - disconnect
 * - error
 * @returns `nginx` child process stream
 */
export const startNginxAndSetupListeners = () => {
	const nginx = spawn('nginx', ['-g', 'daemon off;']);

	logger.info(`[init] Starting nginx as child process with PID ${nginx.pid}`);

	// Exit parent process when nginx is closed
	nginx.on('close', (code, signal) => {
		logger.info(`[nginx] Closed with code ${code} signal ${signal}`);
		logger.info('[nginx] Exit parent process with code 3');
		process.exit(3);
	});

	// Just log
	nginx.stdout.on('data', (data) => logger.info(`[nginx] ${data}`));
	nginx.stderr.on('data', (data) => logger.error(`[nginx] ${data}`));
	nginx.on('disconnect', () => logger.info(`[nginx] Disconnected`));
	nginx.on('error', (err) =>
		logger.error(`[nginx] Received error: ${err.message}`)
	);

	return nginx;
};

/**
 * Test `nginx` configuration
 * @returns `true` if test was successful
 */
export const testNginxConfiguration = () => {
	const status = spawnSync('nginx', ['-t']);
	if (status.error) {
		logger.error(`ERROR: ${status.error.message}`);
		return false;
	}
	return true;
};
