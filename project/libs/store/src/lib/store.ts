import { BehaviorSubject } from 'rxjs';

export interface Store {
	forceRenew: boolean;
}

/** RxJS store */
const store = new BehaviorSubject<Store>({ forceRenew: false });

/**
 * Get the store
 */
export const getStore = (): Store => store.getValue();

/**
 * Update the store
 * @param newStore Store object with properties to update
 */
export const updateStore = (newStore: Partial<Store>): void =>
	store.next({ ...store.getValue(), ...newStore });
