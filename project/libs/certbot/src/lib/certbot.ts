import { getConfig, getLetsEncryptServer } from '@tx/config';
import { getEnv } from '@tx/environment';
import { getStore } from '@tx/store';
import { execute } from '@tx/util';

/**
 * Request a certificate for the primary domain and optional domains.
 * Let certbot descide if an existing certificate needs to be updated.
 *
 * @param primaryDomain Primary domain for certificate
 * @param optionalDomains Domain variants to add to the same certificate
 *
 * @todo
 * #TODO: Implement support for `optionalDomains`
 */
export const requestCertificate = async (
	primaryDomain: string,
	optionalDomains?: string[]
): Promise<boolean> => {
	console.log(`Request certificate for primary domain ${primaryDomain}`);

	// Optional domains are provided with `-d` flag before each domain
	const includeDomainArg = `${
		optionalDomains ? '-d ' : ''
	}${optionalDomains?.join(' -d ')}`;

	const forceRenewal = getStore().forceRenew ? '--force-renewal' : '';

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
        --debug \
        --dry-run`; // FIXME: Control via environment variable

	// Execute command and hence request the certificate
	const status = await execute(command);
	if (status.stderr) {
		console.error(status.stderr);
	}

	// Return false when we have something in stderr
	return status.stderr === '';
};
