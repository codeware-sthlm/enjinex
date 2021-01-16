import { spawn, spawnSync } from 'child_process';

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

	console.log(`[init] Starting nginx as child process with PID ${nginx.pid}`);

	// Exit parent process when nginx is closed
	nginx.on('close', (code, signal) => {
		console.log(`[nginx] Closed with code ${code} signal ${signal}`);
		console.log('[nginx] Exit parent process with code 3');
		process.exit(3);
	});

	// Just log
	nginx.stdout.on('data', (data) => console.log(`[nginx] ${data}`));
	nginx.stderr.on('data', (data) => console.error(`[nginx] ${data}`));
	nginx.on('disconnect', () => console.log(`[nginx] Disconnected`));
	nginx.on('error', (err) =>
		console.error(`[nginx] Received error: ${err.message}`)
	);

	return nginx;
};

/**
 * Test `nginx` configuration
 * @returns `true` if test was successful
 */
export const testNginxConfiguration = () => {
	const status = spawnSync('nginx -t');
	if (status.error) {
		console.log(status.error.message);
		return false;
	}
	return true;
};
