import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  // Base rules (shared across both frontend and backend)
  ...tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    tseslint.configs.strict,
    prettier,
  ),

  // Frontend (Browser/TSX) rules
  ...tseslint.config({
    files: ['frontend/**/*.ts', 'frontend/**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: './frontend/tsconfig.json',
      },
      env: {
        browser: true,
      },
    },
    rules: {
      // TypeScript-specific rules
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-floating-promises': 'error',

      // React/TSX-specific rules
      // Might follow in the future

      // Prettier integration
      'prettier/prettier': 'error', // Enforce Prettier formatting
    },
    plugins: {
      prettier: prettierPlugin,
    }
  }),
];
