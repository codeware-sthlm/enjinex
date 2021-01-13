import { ChildProcessWithoutNullStreams } from 'child_process';

import { disablePendingDomains, transferUserConfig } from '@tx/domain';
import { startNginxAndSetupListeners, testNginxConfiguration } from '@tx/nginx';

import { exitAllProcesses } from './exit-process';
import { startMainLoop } from './main-loop';

/**
 * Main app function
 *
 * #TODO Listen to nginx HUP
 * #TODO Handle --force request some how
 */
export const app = () => {
	let nginx: ChildProcessWithoutNullStreams;

	console.log(`[init] Start main process with PID ${process.pid}`);

	// main process should listen to signals to prevent zombie child processes
	console.log('[init] Listen to SIGINT and SIGTERM');
	process.on('SIGINT', (signal) => exitAllProcesses(signal, nginx));
	process.on('SIGTERM', (signal) => exitAllProcesses(signal, nginx));

	console.log('[init] Transfer user configuration to nginx configuration');
	transferUserConfig();

	console.log('[init] Disable pending domains');
	disablePendingDomains();

	console.log('[init] Test nginx configuration');
	testNginxConfiguration()
		.then(() => {
			// ok start the main processes
			nginx = startNginxAndSetupListeners();
			startMainLoop(nginx);
		})
		.catch((err) => {
			console.error(`[init] ${err}`);
			console.log('[init] Exit parent process with code 2');
			process.exit(2);
		});
};
