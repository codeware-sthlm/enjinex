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

	logger.info(`Starting nginx as child process with PID ${nginx.pid}`);

	// Exit parent process when nginx is closed
	nginx.on('close', (code, signal) => {
		logger.info(`Nginx closed with code ${code} signal ${signal}`);
		logger.info('Exit parent process with code 3');
		process.exit(3);
	});

	// Just log
	nginx.stdout.on('data', (data) => logger.info(`${data}`));
	nginx.stderr.on('data', (data) => logger.error(`${data}`));
	nginx.on('disconnect', () => logger.info(`Nginx disconnected`));
	nginx.on('error', (err) =>
		logger.error(`Nginx received error: ${err.message}`)
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
		logger.error(`${status.error.message}`);
		return false;
	}
	return true;
};
