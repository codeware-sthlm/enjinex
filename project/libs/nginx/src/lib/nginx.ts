import { spawn } from 'child_process';
import { execute } from '@tx/util';

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
 * @returns test messages as promise
 */
export const testNginxConfiguration = () => {
	return execute('nginx -t').then((value) => {
		// nginx actually writes this output to stderr
		console.log(`${value.stderr}`);
		return value.stderr;
	});
};
