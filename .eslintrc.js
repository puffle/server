module.exports = {
	plugins: ['@typescript-eslint'],
	parser: '@typescript-eslint/parser',
	extends: [
		'@n0bodysec',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:@typescript-eslint/recommended-type-checked',
		'plugin:import/typescript',
	],
	parserOptions: {
		project: true,
		tsconfigRootDir: __dirname,
	},
	root: true,
	ignorePatterns: ['node_modules', 'dist'],
	rules: {
		'import/no-cycle': 'off',
		'@typescript-eslint/no-floating-promises': 'off',
		'@typescript-eslint/no-unsafe-assignment': 'off',
		'@typescript-eslint/no-misused-promises': 'off',
		'@typescript-eslint/no-unsafe-member-access': 'warn',
		'@typescript-eslint/no-unsafe-call': 'warn',
	},
};
