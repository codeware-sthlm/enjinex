import { readFileSync, existsSync, rename } from 'fs';
import { basename } from 'path';
import { getConfig } from '@tx/config';
import { logger } from '@tx/logger';
import { copyFolderSync, findFiles } from '@tx/util';

/** File sufix to be aded to disabled domain config files */
const PENDING_SUFIX = '.pending';

/**
 * Search file content for key file paths (`.pem` files) and check that they all exists
 * @param filePath File path to check
 */
const allConfigKeyFilesExists = (filePath: string): boolean => {
	let fileIsMissing = false;

	readFileSync(filePath, {
		encoding: 'utf-8'
	})
		.split(/\r?\n/)
		.forEach((line) => {
			line = line.trim().replace(';', '');
			if (line.endsWith('.pem')) {
				// First empty space indicates start of pem file path
				const idx = line.indexOf(' ');
				if (idx) {
					const pemFile = line.substring(idx).trim();
					if (!existsSync(pemFile)) {
						fileIsMissing = true;
					}
				}
			}
		});

	return !fileIsMissing;
};

/**
 * Extract domain from full path string
 * @param filePath File path to extract
 */
const extractDomain = (filePath: string) => basename(filePath, '.conf');

/**
 * Get pending file path
 * @param filePath File path
 */
const getPendingFilePath = (filePath: string) => `${filePath}${PENDING_SUFIX}`;

/**
 * Domain config files in `/etc/nginx/conf.d/` with certificate and other important key file links,
 * must be disabled if not all key files exists. Otherwise `nginx` will not start upp correctly.
 *
 * Disable those config files by adding prefix `.pending` so that `nginx` don't recognize them as valid config files.
 */
export const disablePendingDomains = (): number => {
	let disabledDomains = 0;
	findFiles(getConfig().nginx.configPath, '*.conf').forEach((filePath) => {
		if (!allConfigKeyFilesExists(filePath)) {
			logger.debug(`Key files missing for ${filePath}, disable domain`);
			rename(filePath, getPendingFilePath(filePath), (err) => {
				if (err) {
					logger.warn(`Renaming file failed with code ${err.code}`);
					logger.warn(err.message);
				} else {
					disabledDomains++;
				}
			});
		}
	});
	return disabledDomains;
};

/**
 * Enable a domain hat was previously set to pending
 * @param domain Domain to enable
 */
export const enableDomain = (domain: string): void => {
	// Check if domain is already enabled
	const filePath = `${getConfig().nginx.configPath}/${domain}.conf`;
	if (existsSync(filePath)) {
		// Skip enabling domain
		return;
	}

	// Check if pending file exists
	const pendingFilePath = getPendingFilePath(filePath);
	if (!existsSync(pendingFilePath)) {
		logger.error(`Could not enable domain, ${pendingFilePath} not found`);
		return;
	}

	logger.info(`Enable pending domain ${domain}`);
	rename(pendingFilePath, filePath, (err) => {
		if (err) {
			logger.error(`Renaming file failed with code ${err.code}`);
			logger.error(err.message);
		}
	});
};

/**
 *
 * Get all domains from its configurations files
 *
 * @description
 * Examine /etc/nginx/conf.d/, looking for lines that
 * contain ssl_certificate_key, and try to find domain names in them.
 * E.g. ssl_certificate_key /etc/letsencrypt/live/<primary_domain_name>/privkey.pem
 */
export const getDomains = (): string[] => {
	return findFiles(getConfig().nginx.configPath, '*.conf')
		.filter((filePath) => {
			// Extract domain
			const domain = extractDomain(filePath);

			// Look for a line similar to this:
			// ssl_certificate_key /etc/letsencrypt/live/${FQDN}/privkey.pem;
			const config = getConfig().cert;
			const certFile = `${config.domainPath}/${domain}/${config.privatePem};`;

			// Read file and split data into separate lines.
			// This is not the most performant solution,
			// but since we know each file has limited number of rows it will be fine.
			// The flow is synchronous which makes it easier to use filter().
			return (
				readFileSync(filePath, {
					encoding: 'utf-8'
				})
					.split(/\r?\n/)
					.filter((line) => {
						if (
							line.includes('ssl_certificate_key') &&
							line.includes(certFile)
						) {
							return true;
						}
						return false;
					}).length > 0
			);
		})
		.map((filePath) => extractDomain(filePath))
		.sort((a, b) => {
			if (a > b) return 1;
			if (b < a) return -1;
			return 0;
		});
};

/**
 * User provided domain configurations should be transfered to nginx configuration
 * @returns number of transfered config files
 */
export const transferUserConfig = (): number => {
	const nginxConfig = getConfig().nginx.configPath;
	const userConfig = getConfig().nginx.userConfigPath;
	copyFolderSync(userConfig, nginxConfig);
	return findFiles(nginxConfig, '*.conf').length;
};
