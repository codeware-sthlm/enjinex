import { getEnv } from '@tx/environment';

/**
 * Configuration model
 */
export interface Config {
	/** Certificate file properties */
	cert: {
		domainPath: string;
		privatePem: string;
	};
	/** Let's Encrypt and `certbot` properties */
	letsEncrypt: {
		productionSite: string;
		stagingSite: string;
		rsaKeySize: number;
		webRoot: string;
	};
	/** `nginx` server properties */
	nginx: {
		/** nginx configuration path */
		configPath: string;
		/** user provided domain configuration path */
		userConfigPath: string;
	};
}

/**
 * Global configuration
 */
export function getConfig(): Config {
	return {
		cert: {
			domainPath: '/etc/letsencrypt/live',
			privatePem: 'privkey.pem'
		},
		letsEncrypt: {
			productionSite: 'https://acme-v02.api.letsencrypt.org/directory',
			stagingSite: 'https://acme-staging-v02.api.letsencrypt.org/directory',
			rsaKeySize: 2048,
			webRoot: '/var/www/letsencrypt'
		},
		nginx: {
			configPath: '/etc/nginx/conf.d',
			userConfigPath: '/etc/nginx/user.conf.d'
		}
	};
}

/**
 * Get Let's Encrypt site based on current environment
 * @returns Production site for production environment and staging for other environments
 */
export const getLetsEncryptServer = () =>
	getEnv().NODE_ENV === 'production'
		? getConfig().letsEncrypt.productionSite
		: getConfig().letsEncrypt.stagingSite;
