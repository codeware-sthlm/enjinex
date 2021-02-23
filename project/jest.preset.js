const nxPreset = require('@nrwl/jest/preset');

module.exports = {
	...nxPreset,
	...{
		collectCoverage: true,
		coverageReporters: ['html', 'json', 'text', 'cobertura', 'lcov'],
		reporters: ['default']
	}
};
