import { ChildProcessWithoutNullStreams } from 'child_process';
import { getConfig } from '@tx/config';

import { exitAllProcesses } from './exit-process';
import { renewalProcess } from './renewal-process';
import { setIntervalWithoutDelay } from '@tx/util';

/**
 * Main app loop for certificate renewal
 * @param nginx nginx process stream
 */
export const startMainLoop = (nginx: ChildProcessWithoutNullStreams) => {
	console.log('[init] Starting main loop...');

	const timer = setIntervalWithoutDelay(async () => {
		const status = renewalProcess();
		if (status > 0) {
			timer.unref();
			exitAllProcesses('renewal failed', nginx);
		}
		console.log(
			`Start next renewal process in ${
				getConfig().letsEncrypt.renewalTimer
			} seconds...`
		);
	}, getConfig().letsEncrypt.renewalTimer * 1000);
};
