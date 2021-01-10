import { disablePendingDomains, transferUserConfig } from '@tx/domain';

import { preProcess } from './pre-process';

jest.mock('@tx/domain', () => ({
	disablePendingDomains: jest.fn(),
	transferUserConfig: jest.fn()
}));

console.log = jest.fn();

describe('pre-process', () => {
	afterEach(() => jest.clearAllMocks());

	it('should call transferUserConfig()', () => {
		preProcess();
		expect(transferUserConfig).toHaveBeenCalledTimes(1);
	});

	it('should call disablePendingDomains()', () => {
		preProcess();
		expect(disablePendingDomains).toHaveBeenCalledTimes(1);
	});
});
