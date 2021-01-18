import * as fs from 'fs';
import { basename, dirname, join } from 'path';
import * as fsMock from 'mock-fs';

import { Config } from '@tx/config';
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
		nginx: { configPath: 'nginx_config.d', userConfigPath: 'config.d' }
	} as Config)
}));

// Mock a filesystem
fsMock({
	'config.d': {
		'domain.com.conf': '',
		'site.com.conf': ''
	},
	'nginx_config.d': fsMock.load(join(dirname(__filename), 'test-files'), {
		lazy: false
	})
});

logger.log = jest.fn();

describe('domain', () => {
	afterAll(() => fsMock.restore());

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('should transfer user config files', () => {
		transferUserConfig();
		expect(fs.existsSync('nginx_config.d/valid-my-site.com.conf')).toBeTruthy();
		expect(fs.existsSync('nginx_config.d/domain.com.conf')).toBeTruthy();
		expect(fs.existsSync('nginx_config.d/site.com.conf')).toBeTruthy();
	});

	it('should only find valid sites', () => {
		expect(getDomains()).toEqual(['valid-keys-site.com', 'valid-my-site.com']);
	});

	it('should not disable valid-keys-site.com', () => {
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

		enableDomain('valid-keys-site2.com');
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

		enableDomain('valid-keys-site.com');
		expect(fs.rename).toHaveBeenCalledTimes(0);
	});
});
