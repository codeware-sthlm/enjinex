import { spawnSync } from 'child_process';

import { requestCertificate } from '@tx/certbot';
import { getConfig } from '@tx/config';
import { enableDomain, getDomains } from '@tx/domain';
import { logger } from '@tx/logger';

/**
 * Main certificate renewal process
 * @returns code 0 when process successful
 */
export const renewalProcess = (): number => {
	logger.info('Starting certificate renewal process');

	if (!process.env.CERTBOT_EMAIL) {
		logger.error(
			'CERTBOT_EMAIL environment variable undefined; certbot will do nothing!'
		);
		return 1;
	}

	let exitCode = 0;

	const domains = getDomains();
	if (domains.length) {
		logger.info(`Found ${domains.length} domains to request certificates for`);
		domains.forEach(async (domain) => {
			// TODO: Drop extra domains feature and look for server_name in config file instead
			const status = requestCertificate(domain);
			if (!status) {
				exitCode = 2;
			}
			enableDomain(domain);
		});

		// Let nginx reload its configuration
		const status = spawnSync('nginx', ['-s', 'reload']);
		if (status.error) {
			logger.error('nginx reload failed');
			logger.error(status.error.message);
			exitCode = 3;
		}
	} else {
		logger.warn('Found no domains to request certificates for');
		logger.warn(
			`Make sure configurations are saved to ${
				getConfig().nginx.userConfigPath
			} with valid content - domain in filename and certificate name inside file must match!`
		);
	}

	logger.info(`End certificate renewal process with code ${exitCode}`);

	return exitCode;
};
