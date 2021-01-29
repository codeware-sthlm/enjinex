import { readFileSync, existsSync, rename } from 'fs';
import { basename } from 'path';
import validator from 'validator';
import { getConfig } from '@tx/config';
import { logger } from '@tx/logger';
import {
	copyFolderSync,
	findFilesFlat,
	readFileToArray,
	replaceAll,
	splitBySpaces,
	unique
} from '@tx/util';

import { Domain } from './domain.interface';

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
						logger.debug(`Key file not found: ${pemFile}`);
						fileIsMissing = true;
					}
				}
			}
		});

	return !fileIsMissing;
};

/**
 * Extract domain from file name, accepting `.conf` and `.conf.pending`
 * @param filePath File path to extract
 */
const extractPrimaryDomainFromFileName = (filePath: string) =>
	basename(filePath.replace('.pending', ''), '.conf');

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
	findFilesFlat(getConfig().nginx.configPath, '*.conf').forEach((filePath) => {
		if (!allConfigKeyFilesExists(filePath)) {
			logger.info(`Key files missing for ${filePath}, disable domain`);
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
export const enableDomain = (domain: Domain): void => {
	// Check if domain is already enabled
	const filePath = `${getConfig().nginx.configPath}/${domain.primary}.conf`;
	if (existsSync(filePath)) {
		// Skip enabling domain
		return;
	}

	// Check if pending file exists
	const pendingFilePath = getPendingFilePath(filePath);
	if (!existsSync(pendingFilePath)) {
		logger.warn(`Could not enable domain, ${pendingFilePath} not found`);
		return;
	}

	// Check if all key files exists before enabling domain
	if (!allConfigKeyFilesExists(pendingFilePath)) {
		logger.warn(
			`Key files still missing for ${extractPrimaryDomainFromFileName(
				filePath
			)}, could not enable domain`
		);
		return;
	}

	logger.info(`Enable pending domain ${domain.primary}`);
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
 * Examine `/etc/nginx/conf.d/` and find all `*.conf` and `*.conf.pending` files.
 * From the file name the primary domain is extracted, e.g. `/etc/nginx/conf.d/mysite.com.conf`
 * extracts to `mysite.com`.
 *
 * For a domain to be valid for renewal these things must be fulflled for content inside each file:
 *
 * 1. a row containing `ssl_certificate_key` must be found, where the path contains the file primary domain name.
 * `ssl_certificate_key /etc/letsencrypt/live/mysite.com/privkey.pem`
 *
 * 2. a row containing `server_name` must be found, which contains the file primary domain name.
 * `server_name mysite.com`
 *
 * 3. if `server_name` contains many domains, all must be unique and contain the file primary domain name,
 * of which the primary domain is first in line.
 * `server_name mysite.com www.mysite.com sub.mysite.com`
 *
 * 4. all certificate files found (ending with `.pem`) must be found in the provided path.
 */
export const getDomains = (): Domain[] => {
	// Store all valid files together with content as rows
	const validFiles = new Map<string, string[]>();

	return (
		findFilesFlat(getConfig().nginx.configPath, '*.conf*')
			.filter((filePath) => {
				// Extract domain
				const domain = extractPrimaryDomainFromFileName(filePath);

				// Only handle valid domains (i.e. user domain config files)
				if (!validator.isFQDN(domain)) {
					logger.debug(`Skip ${domain}: not a valid domain`);
					return false;
				}

				// Get all rows in file
				const fileRows = readFileToArray(filePath);

				// --- Validity checks ---

				// 1. Check `ssl_certificate_key`
				if (!checkSslCertificateKey(fileRows, domain)) {
					logger.warn(`Skip ${domain}: check ssl_certificate_key failed`);
					return false;
				}

				// 2. Check `server_name` for first entity is domain
				if (!checkServerNamePrimaryDomain(fileRows, domain)) {
					logger.warn(
						`Skip ${domain}: primary domain was not the first domain for property server_name`
					);
					return false;
				}

				// 3. Check `server_name` for same main domain
				if (!checkServerNameSameDomain(fileRows, domain)) {
					logger.warn(
						`Skip ${domain}: property server_name contains multiple main domains`
					);
					return false;
				}

				// 3. Check `server_name` for unique domains
				if (!checkServerNameUniqueDomains(fileRows)) {
					logger.warn(
						`Skip ${domain}: property server_name contains duplicate domains`
					);
					return false;
				}

				// Store valid file for processing in .map() stage
				validFiles.set(filePath, fileRows);

				return true;
			})

			// Map to Domain model
			.map((filePath) => {
				// Get all rows from stored valid files
				const rows = validFiles.get(filePath);

				// Extract domains from row starting with server_name,
				// and remove 'server_name' and trailing ';'
				const domainsString = rows
					.find((row) => row.trim().startsWith('server_name'))
					.replace('server_name', '')
					.replace(';', '');

				// Since we have passed all checks we know primary domain is first
				// followed by optional domains
				const domains = splitBySpaces(domainsString);

				return {
					primary: domains.reverse().pop(),
					optional: domains.reverse()
				} as Domain;
			})

			// Order by primary domain
			.sort((a, b) => {
				if (a.primary > b.primary) return 1;
				if (b.primary < a.primary) return -1;
				return 0;
			})
	);
};

/**
 * User provided domain configurations should be transfered to nginx configuration
 * @returns number of transfered config files
 */
export const transferUserConfig = (): number => {
	const nginxConfig = getConfig().nginx.configPath;
	const userConfig = getConfig().nginx.userConfigPath;
	copyFolderSync(userConfig, nginxConfig);
	return findFilesFlat(nginxConfig, '*.conf').length;
};

/**
 * Look for a line similar to this, where optional domains may follow after domain:
 *
 * `server_name ${domain} ... ;`
 *
 * @param rows File rows
 * @param domain Domain to find
 * @returns `true` when domain found for `server_name` as first domain
 */
const checkServerNamePrimaryDomain = (
	rows: string[],
	domain: string
): boolean => {
	return rows.some((line) =>
		replaceAll(line, ' ', '').startsWith(`server_name${domain}`)
	);
};

/**
 * Look for a line similar to this, where all domains must be same main domain:
 *
 * `server_name domain.com sub.domain.com www.domain.com;`
 *
 * @param rows File rows
 * @param domain Current domain
 * @returns `true` when all main domains are the same for `server_name`
 */
const checkServerNameSameDomain = (rows: string[], domain: string): boolean => {
	const serverNameRow = rows
		.filter((line) => replaceAll(line, ' ', '').startsWith('server_name'))
		.pop()
		.trim();

	const domains = splitBySpaces(
		serverNameRow.replace('server_name', '').replace(';', '')
	);

	return domains.every((optDomain) => optDomain.endsWith(domain));
};

/**
 * Look for a line similar to this, where all domains must be unique:
 *
 * `server_name domain.com sub.domain.com www.domain.com;`
 *
 * @param rows File rows
 * @param domain Current domain
 * @returns `true` when only unique domains found for `server_name`
 */
const checkServerNameUniqueDomains = (rows: string[]): boolean => {
	const serverNameRow = rows
		.filter((line) => replaceAll(line, ' ', '').startsWith('server_name'))
		.pop()
		.trim();

	// We don't need to remove 'server_name' since it's also unique
	const items = splitBySpaces(serverNameRow.replace(';', ''));

	return items.length === unique(items).length;
};

/**
 * Look for a line similar to this:
 *
 * `ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;`
 *
 * @param rows File rows
 * @param domain Domain to find
 * @returns `true` when domain found for `ssl_certificate_key` and the pem file exists
 */
const checkSslCertificateKey = (rows: string[], domain: string): boolean => {
	const config = getConfig().cert;
	const certFile = `${config.domainPath}/${domain}/${config.privatePem};`;

	return rows.some(
		(line) => line.includes('ssl_certificate_key') && line.includes(certFile)
	);
};
