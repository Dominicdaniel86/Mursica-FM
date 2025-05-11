import tseslint from 'typescript-eslint';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import { rules } from '../shared/eslintRules.mjs';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
    {
      files: ['**/*.ts'],
      ignores: ['eslint.config.mjs'],
      languageOptions: {
          parser: tseslint.parser,
          parserOptions: {
              project: './tsconfig.json',
              sourceType: 'module',
          },
      },
      settings: {},
      plugins: {
          '@typescript-eslint': tseslint.plugin,
           prettier: prettierPlugin,
          'unused-imports': unusedImportsPlugin,
      },
      rules: {
            ...tseslint.configs.recommended.rules, // Import recommended TypeScript rules
            ...tseslint.configs.recommendedTypeChecked.rules, // Import recommended TypeScript rules for type-checked files
            ...rules, // Import shared rules

            //* Frontend specific rules
            // TypeScript-specific rules
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Warn on unused variables, that are not prefixed with an underscore

            // Browser-specific rules
            'no-alert': 'error', // Disallow usage of alert, confirm, and prompt
            'no-restricted-globals': ['error', 'event', 'fdescribe'], // Disallow usage of certain global variables

            // React/TSX-specific rules
            // Might follow in the future

            // Code quality & strictness
            'no-console': ['warn', { allow: ['warn', 'error'] }], // Warn on console.log, but allow console.warn and console.error
            'no-implicit-globals': 'error', // Disallow implicit globals
        },
    },
];
