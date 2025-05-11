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

            //* Backend (Node.js) specific rules
            // TypeScript-specific rules
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }], // Warn on unused variables, allowing _ prefix for ignored variables
            '@typescript-eslint/strict-boolean-expressions': 'error', // Warn on strict boolean expressions
            
            // Node.js-specific rules
            'no-process-exit': 'error', // Prevent usage of process.exit() outside of CLI files
            'no-sync': 'warn', // Warn on synchronous fs or other blocking Node APIs
            
            // Code quality & strictness
            'no-console': ['error', { allow: ['warn', 'error'] }], // Disallow console.log, but allow console.warn and console.error
        },
    },
];
