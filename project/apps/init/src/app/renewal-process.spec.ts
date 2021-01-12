import { requestCertificate } from '@tx/certbot';
import { getDomains } from '@tx/domain';
import { execute } from '@tx/util';

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
jest.mock('@tx/util', () => ({
	execute: jest.fn().mockImplementation(() => {
		return new Promise((resolve) => {
			resolve({ stdout: '', stderr: '' });
		}) as never;
	})
}));

/** Set all default values since mocked functions are individual for each test */
const setDefaultMockValues = () => {
	process.env.CERTBOT_EMAIL = 'user@me.com';

	(getDomains as jest.Mock).mockReturnValue(['my-site.com']);

	(requestCertificate as jest.Mock).mockReturnValue(
		new Promise((resolve) => resolve(true))
	);

	(execute as jest.Mock).mockImplementation(() => {
		return new Promise((resolve) => {
			resolve({ stdout: 'ok', stderr: '' });
		}) as never;
	});
};

console.log = jest.fn();
console.error = jest.fn();

describe('renewal-process', () => {
	beforeEach(() => {
		jest.resetAllMocks();
		setDefaultMockValues();
	});

	it('should exit and return status code 1 when CERTBOT_EMAIL not set', async () => {
		process.env.CERTBOT_EMAIL = '';
		const statusCode = await renewalProcess();
		expect(statusCode).toBe(1);
		expect(console.error).toHaveBeenCalledTimes(1);
	});

	it('should return status code 2 when request failed', async () => {
		(requestCertificate as jest.Mock).mockReturnValue(
			new Promise((resolve) => resolve(false))
		);
		const statusCode = await renewalProcess();
		expect(statusCode).toBe(2);
		expect(console.error).toHaveBeenCalledTimes(0);
		expect(execute).toHaveBeenCalledTimes(1);
	});

	it('should return status code 3 when nginx reload failed', async () => {
		(execute as jest.Mock).mockImplementation(() => {
			return new Promise((resolve) => {
				resolve({ stdout: '', stderr: 'reload error' });
			}) as never;
		});
		const statusCode = await renewalProcess();
		expect(statusCode).toBe(3);
		expect(execute).toHaveBeenCalledWith('nginx -s reload');
		expect(console.error).toHaveBeenLastCalledWith('reload error');
	});

	it('should return status code 0 successful', async () => {
		const statusCode = await renewalProcess();
		expect(statusCode).toBe(0);
	});
});
