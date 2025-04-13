// filepath: /home/dkraemer/programming-projects/mursica-fm/backend/eslint.config.mjs
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

    // Backend (Node.js) rules
    ...tseslint.config({
      files: ['backend/**/*.ts'],
      languageOptions: {
        parserOptions: {
          project: './backend/tsconfig.json',
        },
        env: {
          node: true,
        },
      },
      rules: {
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/consistent-type-imports': 'warn',
        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'off', // Adjust as needed

        // Prettier integration
        'prettier/prettier': 'error', // Enforce Prettier formatting
      },
      plugins: {
        prettier: prettierPlugin,
      },
    }),
];