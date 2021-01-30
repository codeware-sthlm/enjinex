import { spawnSync, SpawnSyncReturns } from 'child_process';

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
		logger.info(`Apply domains to certificate: ${domain.optional.join(' ')}`);
	}

	// Optional domains are provided with `-d` flag before each domain
	const optionalDomains = domain.optional ?? [];
	const includeDomainArg = `${
		optionalDomains.length ? '-d ' : ''
	}${optionalDomains.join(' -d ')}`;

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
		`${includeDomainArg}`,
		`${forceRenewal}`,
		`${dryRun}`,
		'--debug'
	];

	let status: SpawnSyncReturns<string>;
	if (!isolated) {
		// Spawn command syncron and hence request the certificate
		status = spawnSync(command, args);
	} else {
		logger.info('<<< Running in isolated mode, no request will be made! >>>');
		logger.info('certbot request command:');
		logger.info(`${command} ${args.join(' ')}`);
		status = { error: null } as SpawnSyncReturns<string>;
	}
	if (status.error) {
		logger.error(`Failed with message '${status.error.message}'`);
	} else {
		logger.info('Renewal done');
	}

	// Return false when we have an error
	return !status.error;
};
