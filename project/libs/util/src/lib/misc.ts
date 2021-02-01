/**
 * Replace all occurances in a string with another value
 *
 * @param text text to convert
 * @param find string to be replaced
 * @param replace new string
 * @returns a new converted string
 */
export const replaceAll = (text: string, find: string, replace: string) =>
	text.replace(new RegExp(find, 'g'), replace);

/**
 * Split a string by multiple spaces
 *
 * @param text text to split
 * @returns array with values that was separated by empty spaces
 */
export const splitBySpaces = (text: string) => text.trim().split(/\s+/);

/**
 * Get unique values from an array
 *
 * @param array array to analyze
 * @returns a unique values array
 */
export const unique = (array: string[]) => [...new Set(array)];
