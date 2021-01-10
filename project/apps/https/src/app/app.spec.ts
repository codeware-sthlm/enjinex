import { exit } from 'process';
import { getStore } from '@tx/store';

import { app } from './app';
import { preProcess } from './pre-process';
import { renewalProcess } from './renewal-process';

jest.mock('process', () => ({
	exit: jest.fn().mockImplementation((status) => {
		console.log(`exit code ${status}`);
	})
}));

jest.mock('./pre-process', () => ({
	preProcess: jest.fn()
}));

jest.mock('./renewal-process', () => ({
	renewalProcess: jest.fn()
}));

console.log = jest.fn();

describe('app', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should run renewalProcess when --force or no arguments provided', async () => {
		process.argv = ['', '', '--force'];
		app();
		expect(preProcess).not.toHaveBeenCalled();
		expect(renewalProcess).toHaveBeenCalledTimes(1);

		process.argv = ['', ''];
		app();
		expect(preProcess).not.toHaveBeenCalled();
		expect(renewalProcess).toHaveBeenCalledTimes(2);
	});

	it('should run preProcess only when --pre argument is provided', async () => {
		process.argv = ['', '', '--pre'];
		app();

		expect(preProcess).toHaveBeenCalledTimes(1);
		expect(renewalProcess).not.toHaveBeenCalled();
		expect(exit).toHaveBeenCalledWith(0);
	});

	it('should set store forceRenewal when --force argument is provided', async () => {
		process.argv = ['', '', '--force'];
		app();

		expect(getStore().forceRenew).toBeTruthy();
	});
});
