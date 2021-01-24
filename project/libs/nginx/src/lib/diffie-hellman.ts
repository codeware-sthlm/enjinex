import { spawnSync } from 'child_process';
import { existsSync } from 'fs';

import { getConfig } from '@tx/config';
import { logger } from '@tx/logger';

/**
 * Generate Diffie-Hellman certificate file
 * @param overwrite Overwrite file when it exists
 * @returns false when generating file faled
 */
export const generateDiffieHellmanFile = (overwrite = false): boolean => {
	const ssl = getConfig().ssl;
	if (existsSync(ssl.dhparamFile)) {
		if (!overwrite) {
			logger.info('Keep existing Diffie-Hellman file');
			return true;
		}
		logger.warn('Diffie-Hellman file exists and will be overwritten');
	}
	logger.info(`Generate Diffie-Hellman ${ssl.dhparamBits} bit parameters file`);
	logger.warn('This could take some time, be patient...');
	const status = spawnSync('openssl', [
		'dhparam',
		'-out',
		`${ssl.dhparamFile}`,
		`${ssl.dhparamBits}`
	]);

	// Check if file exists rather than the status
	if (!existsSync(ssl.dhparamFile)) {
		logger.error(status.stderr ?? status.error.message);
		logger.error('Failed creating file');
		return false;
	}

	logger.info(`Successfully created ${ssl.dhparamFile}`);
	return true;
};
