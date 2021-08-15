const nxPreset = require('@nrwl/jest/preset');

module.exports = {
	...nxPreset,
	collectCoverage: true,
	coverageReporters: ['lcov'],
	reporters: ['default']
};
