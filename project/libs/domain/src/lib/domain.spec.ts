import * as fs from 'fs';
import { basename, dirname, join } from 'path';
import * as fsMock from 'mock-fs';

import { Config } from '@tx/config';
import { Domain } from '@tx/domain';
import { logger } from '@tx/logger';

import {
	disablePendingDomains,
	enableDomain,
	getDomains,
	transferUserConfig
} from './domain';

jest.mock('@tx/config', () => ({
	getConfig: jest.fn().mockReturnValue({
		cert: { domainPath: '', privatePem: 'privkey.pem' },
		nginx: { configPath: 'config.d', userConfigPath: 'user.config.d' }
	} as Config)
}));

// Mock a filesystem
fsMock({
	'user.config.d': {
		'domain.com.conf': '',
		'site.com.conf': ''
	},
	'config.d': fsMock.load(join(dirname(__filename), 'test-files', 'config.d'), {
		lazy: false
	}),
	'secure.d': fsMock.load(join(dirname(__filename), 'test-files', 'secure.d'), {
		lazy: false
	}),
	ssl: fsMock.load(join(dirname(__filename), 'test-files', 'ssl'), {
		lazy: false
	}),
	letsencrypt: fsMock.load(
		join(dirname(__filename), 'test-files', 'letsencrypt'),
		{
			lazy: false
		}
	)
});

logger.info = jest.fn();

describe('domain', () => {
	afterAll(() => fsMock.restore());

	beforeEach(() => {
		jest.restoreAllMocks();
	});

	it('should transfer user config files', () => {
		transferUserConfig();
		expect(fs.existsSync('config.d/valid-my-site.com.conf')).toBeTruthy();
		expect(fs.existsSync('config.d/domain.com.conf')).toBeTruthy();
		expect(fs.existsSync('config.d/site.com.conf')).toBeTruthy();
	});

	it('should only find valid domain names matching key file', () => {
		expect(getDomains()).toEqual([
			{
				primary: 'multi-domain-ok.com',
				optional: ['www.multi-domain-ok.com', 'sub.multi-domain-ok.com']
			},
			{ primary: 'valid-keys-site.com', optional: [] },
			{ primary: 'valid-keys-site2.com', optional: [] },
			{ primary: 'valid-my-site.com', optional: [] }
		] as Domain[]);
	});

	it('should not find failed domains with server_name errors', () => {
		expect(
			getDomains().some((domain) =>
				domain.primary.startsWith('multi-domain-fail')
			)
		).toBeFalsy();
	});

	it('should not disable valid sites', () => {
		const configFiles = [];
		jest
			.spyOn(fs, 'rename')
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			.mockImplementation((oldPath, newPath, callback) => {
				configFiles.push(basename(oldPath.toString()));
			});

		disablePendingDomains();
		expect(fs.rename).toHaveBeenCalledTimes(2);
		expect(configFiles.length).toBe(2);
		expect(configFiles.includes('multi-domain-ok.com')).toBeFalsy();
		expect(configFiles.includes('valid-keys-site.com.conf')).toBeFalsy();
	});

	it('should enable valid-keys-site2.com', () => {
		const configFiles = [];
		jest
			.spyOn(fs, 'rename')
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			.mockImplementation((oldPath, newPath, callback) => {
				configFiles.push(basename(newPath.toString()));
			});

		enableDomain({ primary: 'valid-keys-site2.com' });
		expect(fs.rename).toHaveBeenCalledTimes(1);
		expect(configFiles).toEqual(['valid-keys-site2.com.conf']);
	});

	it('should not enable valid-keys-site.com', () => {
		jest
			.spyOn(fs, 'rename')
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			.mockImplementation((oldPath, newPath, callback) => {
				//noop
			});

		enableDomain({ primary: 'valid-keys-site.com' });
		expect(fs.rename).toHaveBeenCalledTimes(0);
	});
});
