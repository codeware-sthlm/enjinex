import { getStore, updateStore, Store } from './store';

describe('store', () => {
	it('should get default store', () => {
		expect(getStore()).toEqual(<Store>{ forceRenew: false });
	});

	it('should update store', () => {
		updateStore({ forceRenew: true });
		expect(getStore()).toEqual(<Store>{ forceRenew: true });
	});
});
