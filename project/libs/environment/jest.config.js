// eslint-disable-next-line no-undef
module.exports = {
	displayName: 'environment',
	preset: '../../jest.preset.js',
	globals: {
		'ts-jest': { tsconfig: '<rootDir>/tsconfig.spec.json' }
	},
	transform: {
		'^.+\\.[tj]sx?$': 'ts-jest'
	},
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
	coverageDirectory: '../../coverage/libs/environment'
};
