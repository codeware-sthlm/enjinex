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

	let timerRef: NodeJS.Timeout = null;
	timerRef = setIntervalWithoutDelay(() => {
		const status = renewalProcess();
		if (status > 0) {
			if (timerRef) {
				timerRef.unref();
			}
			exitAllProcesses('renewal failed', nginx);
		}

		// Isolated test only run one loop and then exit after some seconds
		if (getEnv().ISOLATED === 'Y') {
			let isolatedSeconds = 60;
			logger.info(
				`Successfully run one loop - isolated mode will now exit in ${isolatedSeconds} seconds...`
			);
			setIntervalWithoutDelay(() => {
				if (isolatedSeconds === 0) {
					logger.info('End of test!');
					process.exit(-1);
				}
				if (isolatedSeconds < 10) {
					logger.info(`Exit in ${isolatedSeconds}...`);
				}
				isolatedSeconds--;
			}, 1000);
		}
		// Normal loop
		else {
			logger.info(`Start next renewal process in ${renewalTimer} seconds...`);
		}
	}, renewalTimer * 1000);
};
