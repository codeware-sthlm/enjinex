import { Env, getEnv } from './environment';

describe('environment', () => {
	it('should get current environment', () => {
		expect(getEnv()).toEqual(<Env>{
			CERTBOT_EMAIL: '',
			DRY_RUN: 'Y',
			NODE_ENV: 'test'
		});
	});
});
