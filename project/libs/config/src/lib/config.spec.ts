import { NodeEnv } from '@tx/environment';

import { getConfig, getLetsEncryptServer } from './config';

describe('config', () => {
	it('should get Lets Encrypt staging server for non-prod env', () => {
		process.env.NODE_ENV = 'development' as NodeEnv;
		expect(getLetsEncryptServer()).toEqual(getConfig().letsEncrypt.stagingSite);

		process.env.NODE_ENV = 'staging' as NodeEnv;
		expect(getLetsEncryptServer()).toEqual(getConfig().letsEncrypt.stagingSite);

		process.env.NODE_ENV = 'test' as NodeEnv;
		expect(getLetsEncryptServer()).toEqual(getConfig().letsEncrypt.stagingSite);
	});

	it('should get production Lets Encrypt server for prod env', () => {
		process.env.NODE_ENV = 'production';
		expect(getLetsEncryptServer()).toEqual(
			getConfig().letsEncrypt.productionSite
		);
	});
});
