import { ChildProcessWithoutNullStreams } from 'child_process';

import { disablePendingDomains, transferUserConfig } from '@tx/domain';
import { logger } from '@tx/logger';
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

	logger.info(`Start main process with PID ${process.pid}`);

	// main process should listen to signals to prevent zombie child processes
	logger.info('Listen to SIGINT and SIGTERM signals');
	process.on('SIGINT', (signal) => exitAllProcesses(signal, nginx));
	process.on('SIGTERM', (signal) => exitAllProcesses(signal, nginx));

	logger.info('Transfer user configuration to nginx configuration...');
	const transferedFiles = transferUserConfig();
	logger.info(`${transferedFiles} config files was transfered`);

	logger.info('Disable pending domains...');
	const disabledDomains = disablePendingDomains();
	logger.info(`${disabledDomains} domains was disabled`);

	logger.info('Test nginx configuration...');
	if (testNginxConfiguration()) {
		logger.info('Status: OK');
		// ok start the main processes
		nginx = startNginxAndSetupListeners();
		startMainLoop(nginx);
	} else {
		logger.warn('Test failed -> Exit parent process with code 2');
		process.exit(2);
	}
};
