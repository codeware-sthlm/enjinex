import { spawnSync } from 'child_process';

import { getConfig, getLetsEncryptServer } from '@tx/config';
import { Domain } from '@tx/domain';
import { getEnv } from '@tx/environment';
import { logger } from '@tx/logger';
import { getStore } from '@tx/store';

/**
 * Request a certificate for the primary domain and optional domains.
 * Let certbot descide if an existing certificate needs to be updated.
 *
 * @param domain Domains for certificate
 * @returns `true` when request was successful
 */
export const requestCertificate = (domain: Domain): boolean => {
	logger.info(`Request certificate for primary domain ${domain.primary}...`);
	if (domain.optional?.length) {
		logger.info(`More domains to append: ${domain.optional.join(' ')}`);
	}

	// All domains are provided as comma separated list with `-d` flag
	const domainArr = [...[domain.primary], ...(domain.optional ?? [])];

	const forceRenewal = getStore().forceRenew ? '--force-renewal' : '';
	const dryRun = getEnv().DRY_RUN === 'Y' ? '--dry-run' : '';
	const isolated = getEnv().ISOLATED === 'Y';

	// Create certbot command
	const config = getConfig().letsEncrypt;
	const command = 'certbot';
	const args = [
		'certonly',
		'--agree-tos',
		'--keep',
		'-n',
		'--text',
		'-a',
		'webroot',
		`--webroot-path=${config.webRoot}`,
		'--rsa-key-size',
		`${config.rsaKeySize}`,
		'--preferred-challenges',
		'http-01',
		'--email',
		`${getEnv().CERTBOT_EMAIL}`,
		'--server',
		`${getLetsEncryptServer()}`,
		'--cert-name',
		`${domain.primary}`,
		'-d',
		`${domainArr.join(',')}`,
		`${forceRenewal}`,
		`${dryRun}`
	].filter((arg) => !!arg);

	// Log command
	logger.info(`${command} ${args.join(' ')}`);

	// Isolated mode makes no request
	if (isolated) {
		logger.info('<<< Running in isolated mode, no request will be made! >>>');
		return true;
	}

	// Spawn command syncron and request the certificate
	try {
		const output = spawnSync(command, args, { encoding: 'utf8' });
		logger.info(`Started certbot request with PID ${output.pid}`);

		// Check for renewal attempt failed
		if (output.status === 1) {
			logger.error(`Status code ${output.status}`);
			logger.error(output.stderr.trim());
			return false;
		}

		// Request successful
		logger.info(`Status code ${output.status}`);
		if (output.stderr.trim()) {
			logger.info(output.stderr.trim());
		}
		logger.info('Renewal attempt done');
	} catch (error) {
		logger.error(error);
		return false;
	}

	// Errors have been returned false in previous stages
	return true;
};
