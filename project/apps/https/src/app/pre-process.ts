import { disablePendingDomains, transferUserConfig } from '@tx/domain';

/**
 * #TODO This pre process is used until all scripts converted to node apps
 */
export const preProcess = () => {
	console.log('Transfer user configuration to nginx configuration');
	transferUserConfig();

	console.log('Disable pending domains');
	disablePendingDomains();
};
