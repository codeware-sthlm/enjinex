/**
 * `setInterval` but without initial interval delay
 * @param fn function to call
 * @param interval interval timer in milliseconds
 */
export const setIntervalWithoutDelay = (
	fn: (...args) => void,
	interval: number
) => {
	fn();
	return setInterval(fn, interval);
};
