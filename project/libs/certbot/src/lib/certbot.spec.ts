import { spawnSync } from 'child_process';

import { getConfig } from '@tx/config';
import { Domain } from '@tx/domain';
import { logger } from '@tx/logger';
import { updateStore } from '@tx/store';
import { replaceAll } from '@tx/util';

import { requestCertificate } from './certbot';

interface ExecResponse {
	pid: number;
	status: number;
	stdout: string;
	stderr: string;
}

let execArgs: string[];
let execCommand: string;
let domain: Domain;

const NO_DOMAIN = { primary: '' } as Domain;
const FAKE_STDERR = { primary: 'fake-stderr.nu' } as Domain;
const FAKE_CATCH = { primary: 'fake-catch.nu' } as Domain;

jest.mock('child_process', () => ({
	spawnSync: jest.fn().mockImplementation((command: string, args: string[]):
		| Error
		| ExecResponse => {
		execArgs = [...args];
		execCommand = `${command} ${args.join(' ')}`;
		if (execArgs.includes(FAKE_CATCH.primary)) {
			throw new Error('invalid command');
		} else if (execArgs.includes(FAKE_STDERR.primary)) {
			return {
				pid: 99,
				status: 2,
				stdout: '',
				stderr: 'certbot error'
			};
		} else {
			return {
				pid: 99,
				status: 1,
				stdout: 'Renewal request was successful',
				stderr: ''
			};
		}
	})
}));

logger.info = jest.fn();
logger.error = jest.fn();

describe('certbot', () => {
	beforeEach(() => {
		logger.error = jest.fn();
		domain = { primary: 'my-site.com' };
		execCommand = '';
	});

	it('should never have undefined in command', () => {
		requestCertificate(NO_DOMAIN);
		expect(execCommand.includes('undefined')).toBeFalsy();

		requestCertificate(domain);
		expect(execCommand.includes('undefined')).toBeFalsy();

		domain = { ...domain, optional: ['a@b.com'] };
		requestCertificate(domain);
		expect(execCommand.includes('undefined')).toBeFalsy();
	});

	it('should never have empty spawnSync arguments', () => {
		requestCertificate(domain);
		expect(execArgs.some((arg) => arg === '')).toBeFalsy();
	});

	it('should return true for sucessful request', () => {
		const status = requestCertificate(domain);
		expect(logger.info).toHaveBeenCalledWith('Renewal request was successful');
		expect(status).toBeTruthy();
	});

	it('should print error and return false for invalid request command', () => {
		const status = requestCertificate(FAKE_CATCH);
		expect(logger.error).toHaveBeenCalledWith(new Error('invalid command'));
		expect(status).toBeFalsy();
	});

	it('should print error and return false for certbot error', () => {
		const status = requestCertificate(FAKE_STDERR);
		expect(logger.error).toHaveBeenLastCalledWith('certbot error');
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

	it('should set cert-name to primary domain', () => {
		requestCertificate(domain);
		expect(execCommand.includes(`--cert-name ${domain.primary}`)).toBeTruthy();
	});

	it('should have primary domain only', () => {
		requestCertificate(domain);
		expect(
			execCommand.includes(`--cert-name ${domain.primary} -d ${domain.primary}`)
		).toBeTruthy();

		expect(
			replaceAll(execCommand, ' ', '').includes(
				`--cert-name${domain.primary}-d${domain.primary}`
			)
		).toBeTruthy();
	});

	it('should have multiple domains', () => {
		domain = { ...domain, optional: ['a@a.com', 'b@b.com', 'c@c.com'] };
		requestCertificate(domain);
		expect(
			execCommand.includes(
				`--cert-name ${domain.primary} -d ${domain.primary},a@a.com,b@b.com,c@c.com`
			)
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

	it('should not run in isolated mode by default', () => {
		(spawnSync as jest.Mock).mockClear();
		requestCertificate(domain);
		expect(spawnSync).toBeCalledTimes(1);
	});

	it('should run in isolated mode from ISOLATED environment', () => {
		(spawnSync as jest.Mock).mockClear();
		process.env.ISOLATED = 'N';
		requestCertificate(domain);
		expect(spawnSync).toBeCalledTimes(1);

		(spawnSync as jest.Mock).mockClear();
		process.env.ISOLATED = 'Y';
		requestCertificate(domain);
		expect(spawnSync).not.toBeCalled();
	});
});
