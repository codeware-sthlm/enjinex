import { exit } from 'process';
import { updateStore } from '@tx/store';

import { preProcess } from './pre-process';
import { renewalProcess } from './renewal-process';

/**
 * Map optional arguments and update store and pass on as main argument
 */
const getArgs = (): string[] => {
	const argv = process.argv.slice(2);

	return argv.map((arg) => {
		if (arg === '--force') {
			updateStore({ forceRenew: true });
		}
		return arg;
	});
};

/**
 * Main app function
 */
export async function app() {
	let status = 0;
	const args = getArgs();

	console.log(
		`Start https ${
			args.length
				? 'with arguments: ' + args.join(' ').trim()
				: 'without arguments'
		}`
	);

	if (args.includes('--pre')) {
		preProcess();
	} else {
		status = await renewalProcess();
	}

	exit(status);
}
