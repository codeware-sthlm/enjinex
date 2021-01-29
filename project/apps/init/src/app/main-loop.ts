import { ChildProcessWithoutNullStreams } from 'child_process';
import { getConfig } from '@tx/config';
import { getEnv } from '@tx/environment';
import { logger } from '@tx/logger';
import { setIntervalWithoutDelay } from '@tx/util';

import { exitAllProcesses } from './exit-process';
import { renewalProcess } from './renewal-process';

/**
 * Main app loop for certificate renewal
 * @param nginx nginx process stream
 */
export const startMainLoop = (nginx: ChildProcessWithoutNullStreams) => {
	logger.info('Starting main loop...');

	const renewalTimer = getConfig().letsEncrypt.renewalTimer;

	const timer = setIntervalWithoutDelay(() => {
		const status = renewalProcess();
		if (status > 0) {
			if (timer) timer.unref();
			exitAllProcesses('renewal failed', nginx);
		}

		// Isolated test only run one loop and then exit after some seconds
		if (getEnv().ISOLATED === 'Y') {
			logger.info(
				'Successfully run one loop - isolated mode will now exit in...'
			);
			let isolatedSeconds = 5;
			setIntervalWithoutDelay(() => {
				if (isolatedSeconds === 0) {
					logger.info('End of test!');
					process.exit(-1);
				}
				logger.info(`${isolatedSeconds--}`);
			}, 1000);
		}
		// Normal loop
		else {
			logger.info(`Start next renewal process in ${renewalTimer} seconds...`);
		}
	}, renewalTimer * 1000);
};
