import { getConfig } from '@tx/config';
import { updateStore } from '@tx/store';

import { requestCertificate } from './certbot';

interface ExecResponse {
	stdout: string;
	stderr: string;
}

let execCommand: string;
let domain: string;

jest.mock('@tx/util', () => ({
	execute: jest.fn().mockImplementation((command: string) => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		return new Promise<ExecResponse>((resolve, reject) => {
			execCommand = command;
			if (command.includes('--cert-name  ')) {
				resolve({ stdout: '', stderr: 'missing primary domain' });
			}
			resolve({ stdout: 'ok', stderr: '' });
		});
	})
}));

console.log = jest.fn();
console.error = jest.fn();

describe('certbot', () => {
	beforeEach(() => {
		domain = 'my-site.com';
		execCommand = '';
	});

	it('should return true for sucessful request', async () => {
		const status = await requestCertificate(domain);
		expect(status).toBeTruthy();
	});

	it('should print error and return false for failed request', async () => {
		const status = await requestCertificate('');
		expect(console.error).toHaveBeenCalledTimes(1);
		expect(status).toBeFalsy();
	});

	it('should use certonly', async () => {
		await requestCertificate(domain);
		expect(execCommand.includes('certonly')).toBeTruthy();
	});

	it('should use web root to store certificates', async () => {
		await requestCertificate(domain);
		expect(
			execCommand.includes(
				`-a webroot --webroot-path=${getConfig().letsEncrypt.webRoot}`
			)
		).toBeTruthy();
	});

	it('should use default RSA key size 2048', async () => {
		await requestCertificate(domain);
		expect(execCommand.includes('--rsa-key-size 2048')).toBeTruthy();
	});

	it('should set email to env CERTBOT_EMAIL', async () => {
		process.env.CERTBOT_EMAIL = 'user@me.com';
		await requestCertificate(domain);
		expect(
			execCommand.includes(`--email ${process.env.CERTBOT_EMAIL}`)
		).toBeTruthy();
	});

	it('should set default server to staging', async () => {
		await requestCertificate(domain);
		expect(
			execCommand.includes(`--server ${getConfig().letsEncrypt.stagingSite}`)
		).toBeTruthy();
	});

	it('should set primary domain', async () => {
		await requestCertificate(domain);
		expect(execCommand.includes(`--cert-name ${domain}`)).toBeTruthy();
	});

	it('should set optional domains', async () => {
		const optDomains = ['a@a.com', 'b@b.com', 'c@c.com'];

		await requestCertificate(domain);
		expect(
			execCommand.includes('-d a@a.com -d b@b.com -d c@c.com')
		).toBeFalsy();

		await requestCertificate(domain, optDomains);
		expect(
			execCommand.includes('-d a@a.com -d b@b.com -d c@c.com')
		).toBeTruthy();
	});

	it('should force renewal', async () => {
		await requestCertificate(domain);
		expect(execCommand.includes('--force-renewal')).toBeFalsy();

		updateStore({ forceRenew: true });
		await requestCertificate(domain);
		expect(execCommand.includes('--force-renewal')).toBeTruthy();
	});
});
