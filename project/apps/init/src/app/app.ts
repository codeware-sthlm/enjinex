import { ChildProcessWithoutNullStreams } from 'child_process';

import { disablePendingDomains, transferUserConfig } from '@tx/domain';
import { logger } from '@tx/logger';
import {
	generateDiffieHellmanFile,
	startNginxAndSetupListeners,
	testNginxConfiguration
} from '@tx/nginx';
import { updateStore } from '@tx/store';

import { exitAllProcesses } from './exit-process';
import { startMainLoop } from './main-loop';
import { renewalProcess } from './renewal-process';

/**
 * Main app function
 */
export const app = () => {
	let nginx: ChildProcessWithoutNullStreams;

	logger.info(`Start main process with PID ${process.pid}`);

	// main process should listen to signals to prevent zombie child processes
	logger.info('Listen to SIGINT and SIGTERM signals');
	process.on('SIGINT', (signal) => exitAllProcesses(signal, nginx));
	process.on('SIGTERM', (signal) => exitAllProcesses(signal, nginx));
	process.on('SIGUSR2', (signal) => {
		logger.info(
			`Received signal ${signal} -> force renewal of all certificates once!`
		);
		updateStore({ forceRenew: true });
		renewalProcess();
		updateStore({ forceRenew: false });
		logger.info('Force renewal has been reset for next renewal attempt');
	});

	logger.info('Diffie-Hellman parameters file...');
	if (!generateDiffieHellmanFile()) {
		process.exit(1);
	}
	logger.info(`File OK`);

	logger.info('Transfer user configuration to nginx configuration...');
	const transferedFiles = transferUserConfig();
	logger.info(`${transferedFiles} config files was transfered`);

	logger.info('Disable pending domains...');
	const disabledDomains = disablePendingDomains();
	logger.info(`${disabledDomains} domains was disabled`);

	logger.info('Test nginx configuration...');
	if (testNginxConfiguration()) {
		logger.info('Test OK');
		// ok start the main processes
		nginx = startNginxAndSetupListeners();
		startMainLoop(nginx);
	} else {
		logger.warn('Test failed -> Exit parent process with code 2');
		process.exit(2);
	}
};
