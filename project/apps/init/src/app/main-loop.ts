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
		const status = await renewalProcess();
		if (status > 0) {
			timer.unref();
			exitAllProcesses('renewal failed', nginx);
		}
	}, getConfig().letsEncrypt.renewalTimer * 1000);
};
