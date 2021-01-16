import { spawnSync } from 'child_process';

import { getConfig, getLetsEncryptServer } from '@tx/config';
import { getEnv } from '@tx/environment';
import { getStore } from '@tx/store';

/**
 * Request a certificate for the primary domain and optional domains.
 * Let certbot descide if an existing certificate needs to be updated.
 *
 * @param primaryDomain Primary domain for certificate
 * @param optionalDomains Domain variants to add to the same certificate
 * @returns `true` when request was successful
 *
 * @todo
 * #TODO: Implement support for `optionalDomains`
 */
export const requestCertificate = (
	primaryDomain: string,
	optionalDomains?: string[]
): boolean => {
	console.log(`Request certificate for primary domain ${primaryDomain}...`);

	// Optional domains are provided with `-d` flag before each domain
	optionalDomains = optionalDomains ?? [];
	const includeDomainArg = `${
		optionalDomains.length ? '-d ' : ''
	}${optionalDomains.join(' -d ')}`;

	const forceRenewal = getStore().forceRenew ? '--force-renewal' : '';
	const dryRun = getEnv().DRY_RUN === 'Y' ? '--dry-run' : '';

	// Create certbot command
	const config = getConfig().letsEncrypt;
	const command = `
      certbot certonly \
        --agree-tos --keep -n --text \
        -a webroot --webroot-path=${config.webRoot} \
        --rsa-key-size ${config.rsaKeySize} \
        --preferred-challenges http-01 \
        --email ${getEnv().CERTBOT_EMAIL} \
        --server ${getLetsEncryptServer()} \
        --cert-name ${primaryDomain} \
        ${includeDomainArg} \
        ${forceRenewal} \
        ${dryRun} \
        --debug`;

	// Spawn command syncron and hence request the certificate
	const status = spawnSync(command);
	if (status.error) {
		console.error(`Failed with message '${status.error.message}'`);
	} else {
		console.log('Status OK');
	}

	// Return false when we have an error
	return !status.error;
};
