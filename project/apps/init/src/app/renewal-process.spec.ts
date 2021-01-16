import { spawnSync } from 'child_process';

import { requestCertificate } from '@tx/certbot';
import { getDomains } from '@tx/domain';

import { renewalProcess } from './renewal-process';

jest.mock('@tx/certbot', () => ({
	requestCertificate: jest
		.fn()
		.mockReturnValue(new Promise((resolve) => resolve(true)))
}));
jest.mock('@tx/domain', () => ({
	enableDomain: jest.fn(),
	getDomains: jest.fn().mockReturnValue(['my-site.com'])
}));
jest.mock('child_process', () => ({
	spawnSync: jest.fn().mockReturnValue({ error: undefined })
}));

/** Set all default values since mocked functions are individual for each test */
const setDefaultMockValues = () => {
	process.env.CERTBOT_EMAIL = 'user@me.com';

	(getDomains as jest.Mock).mockReturnValue(['my-site.com']);

	(requestCertificate as jest.Mock).mockReturnValue(true);

	(spawnSync as jest.Mock).mockReturnValue({ error: undefined });
};

console.log = jest.fn();
console.error = jest.fn();

describe('renewal-process', () => {
	beforeEach(() => {
		jest.resetAllMocks();
		setDefaultMockValues();
	});

	it('should exit and return status code 1 when CERTBOT_EMAIL not set', () => {
		process.env.CERTBOT_EMAIL = '';
		const statusCode = renewalProcess();
		expect(statusCode).toBe(1);
		expect(console.error).toHaveBeenCalledTimes(1);
	});

	it('should return status code 2 when request failed', () => {
		(requestCertificate as jest.Mock).mockReturnValue(false);
		const statusCode = renewalProcess();
		expect(statusCode).toBe(2);
		expect(console.error).toHaveBeenCalledTimes(0);
		expect(spawnSync).toHaveBeenCalledTimes(1);
	});

	it('should return status code 3 when nginx reload failed', () => {
		(spawnSync as jest.Mock).mockReturnValue({
			error: { message: 'reload error' }
		});
		const statusCode = renewalProcess();
		expect(statusCode).toBe(3);
		expect(spawnSync).toHaveBeenCalledWith('nginx -s reload');
		expect(console.error).toHaveBeenLastCalledWith('reload error');
	});

	it('should return status code 0 successful', () => {
		const statusCode = renewalProcess();
		expect(statusCode).toBe(0);
	});
});
