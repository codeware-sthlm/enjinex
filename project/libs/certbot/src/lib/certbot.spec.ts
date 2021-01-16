import { getConfig } from '@tx/config';
import { updateStore } from '@tx/store';

import { requestCertificate } from './certbot';

interface ExecResponse {
	error: { message: string };
}

let execCommand: string;
let domain: string;

jest.mock('child_process', () => ({
	spawnSync: jest.fn().mockImplementation(
		(command: string): ExecResponse => {
			execCommand = command;
			if (command.includes('--cert-name  ')) {
				return { error: { message: 'missing primary domain' } };
			}
			return { error: undefined };
		}
	)
}));

console.log = jest.fn();

describe('certbot', () => {
	beforeEach(() => {
		console.error = jest.fn();
		domain = 'my-site.com';
		execCommand = '';
	});

	it('should never have undefined in command', () => {
		requestCertificate('');
		expect(execCommand.includes('undefined')).toBeFalsy();

		requestCertificate(domain);
		expect(execCommand.includes('undefined')).toBeFalsy();

		requestCertificate(domain, ['a@b.com']);
		expect(execCommand.includes('undefined')).toBeFalsy();
	});

	it('should return true for sucessful request', () => {
		const status = requestCertificate(domain);
		expect(status).toBeTruthy();
	});

	it('should print error and return false for failed request', () => {
		const status = requestCertificate('');
		expect(console.error).toHaveBeenCalledTimes(1);
		expect(status).toBeFalsy();
	});

	it('should use certonly', () => {
		requestCertificate(domain);
		expect(execCommand.includes('certonly')).toBeTruthy();
	});

	it('should use web root to store certificates', () => {
		requestCertificate(domain);
		expect(
			execCommand.includes(
				`-a webroot --webroot-path=${getConfig().letsEncrypt.webRoot}`
			)
		).toBeTruthy();
	});

	it('should use default RSA key size 2048', () => {
		requestCertificate(domain);
		expect(execCommand.includes('--rsa-key-size 2048')).toBeTruthy();
	});

	it('should set email to environment CERTBOT_EMAIL', () => {
		process.env.CERTBOT_EMAIL = 'user@me.com';
		requestCertificate(domain);
		expect(
			execCommand.includes(`--email ${process.env.CERTBOT_EMAIL}`)
		).toBeTruthy();
	});

	it('should set default server to staging', () => {
		requestCertificate(domain);
		expect(
			execCommand.includes(`--server ${getConfig().letsEncrypt.stagingSite}`)
		).toBeTruthy();
	});

	it('should set server to production when NODE_ENV is production', () => {
		process.env.NODE_ENV = 'production';
		requestCertificate(domain);
		expect(
			execCommand.includes(`--server ${getConfig().letsEncrypt.productionSite}`)
		).toBeTruthy();
	});

	it('should set primary domain', () => {
		requestCertificate(domain);
		expect(execCommand.includes(`--cert-name ${domain}`)).toBeTruthy();
	});

	it('should set optional domains', () => {
		const optDomains = ['a@a.com', 'b@b.com', 'c@c.com'];

		requestCertificate(domain);
		expect(
			execCommand.includes('-d a@a.com -d b@b.com -d c@c.com')
		).toBeFalsy();

		requestCertificate(domain, optDomains);
		expect(
			execCommand.includes('-d a@a.com -d b@b.com -d c@c.com')
		).toBeTruthy();
	});

	it('should not force renewal by default', () => {
		requestCertificate(domain);
		expect(execCommand.includes('--force-renewal')).toBeFalsy();
	});

	it('should trigger force renewal', () => {
		updateStore({ forceRenew: true });
		requestCertificate(domain);
		expect(execCommand.includes('--force-renewal')).toBeTruthy();
	});

	it('should not use dry run request by default', () => {
		requestCertificate(domain);
		expect(execCommand.includes('--dry-run')).toBeFalsy();
	});

	it('should dry run request from DRY_RUN environment', () => {
		process.env.DRY_RUN = 'N';
		requestCertificate(domain);
		expect(execCommand.includes('--dry-run')).toBeFalsy();

		process.env.DRY_RUN = 'Y';
		requestCertificate(domain);
		expect(execCommand.includes('--dry-run')).toBeTruthy();
	});
});
