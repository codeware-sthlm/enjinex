import { replaceAll, splitBySpaces, unique } from './misc';

describe('misc', () => {
	describe('replaceAll', () => {
		it('should replace one char with another', () => {
			expect(replaceAll('ABC', 'A', 'B')).toBe('BBC');
		});

		it('should replace one char with two', () => {
			expect(replaceAll('ABC', 'B', 'AA')).toBe('AAAC');
		});

		it('should replace two characters with one', () => {
			expect(replaceAll('ABC', 'BC', 'D')).toBe('AD');
		});

		it('should remove all spaces', () => {
			expect(replaceAll('A B C D     E', ' ', '')).toBe('ABCDE');
		});

		it('should keep text when nothing matched', () => {
			expect(replaceAll('A B C', 'X', '')).toBe('A B C');
		});

		it('should handle empty text', () => {
			expect(replaceAll('', 'X', '')).toBe('');
		});
	});

	describe('splitBySpaces', () => {
		it('should split by one space', () => {
			expect(splitBySpaces('A B')).toEqual(['A', 'B']);
		});

		it('should split by many spaces', () => {
			expect(splitBySpaces('A      B')).toEqual(['A', 'B']);
		});

		it('should skip leading and trailing spaces', () => {
			expect(splitBySpaces('    A      B    ')).toEqual(['A', 'B']);
		});

		it('should split many', () => {
			expect(splitBySpaces('A word is a set of chars')).toEqual([
				'A',
				'word',
				'is',
				'a',
				'set',
				'of',
				'chars'
			]);
		});

		it('should keep text as array without spaces', () => {
			expect(splitBySpaces('ABC')).toEqual(['ABC']);
		});

		it('should handle empty text', () => {
			expect(splitBySpaces('')).toEqual(['']);
		});
	});

	describe('unique', () => {
		it('should remove duplicates', () => {
			expect(unique(['A', 'B', 'A'])).toEqual(['A', 'B']);
		});

		it('should keep when no duplicates exist', () => {
			expect(unique(['A', 'B', 'C'])).toEqual(['A', 'B', 'C']);
		});

		it('should handle empty array', () => {
			expect(unique([])).toEqual([]);
		});
	});
});
