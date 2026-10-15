import js from '@eslint/js';
import globals from 'globals';

export default [
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            'tests/**',
            'src/js/jquery.min.js',
        ],
    },
    js.configs.recommended,
    {
        files: ['src/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                chrome: 'readonly',
                $: 'readonly',
                jQuery: 'readonly',
            },
        },
        // Legacy code is rewritten in P2-P4; relax noisy style rules rather than churn it now.
        rules: {
            'no-unused-vars': ['warn', { args: 'none' }],
            'no-prototype-builtins': 'off',
            'no-cond-assign': 'warn',
            'no-redeclare': 'warn',
            'no-useless-assignment': 'warn',
        },
    },
    {
        files: ['scripts/**/*.mjs', 'eslint.config.js'],
        languageOptions: { sourceType: 'module', globals: globals.node },
    },
];
