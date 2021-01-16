import { Env, getEnv } from './environment';

describe('environment', () => {
	it('should get current environment', () => {
		expect(getEnv()).toEqual(<Env>{
			CERTBOT_EMAIL: '',
			DRY_RUN: 'N',
			NODE_ENV: 'test'
		});
	});
});
