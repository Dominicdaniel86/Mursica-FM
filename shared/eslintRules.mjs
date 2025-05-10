export const rules = {
    // TypeScript-specific rules
    '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': 'allow-with-description' }], // Disallow ts-ignore comments without description
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'], // Enforce consistent type definitions (using interface, not type)
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }], // Prefer type imports over value imports
    '@typescript-eslint/explicit-function-return-type': 'off', // Allow functions to have no explicit return type
    '@typescript-eslint/explicit-module-boundary-types': 'warn', // Warn on missing return types on exported functions
    '@typescript-eslint/no-explicit-any': 'warn', // Warn on usage of the any type
    '@typescript-eslint/no-floating-promises': 'error', // Enforce handling of promises
    '@typescript-eslint/no-inferrable-types': 'warn', // Warn on explicit type declarations for initialized variables or parameters
    '@typescript-eslint/no-misused-promises': 'error', // Detect misused promises in place of expected non-promise values
    '@typescript-eslint/no-shadow': 'error', // Disallow shadowing of variables
    '@typescript-eslint/no-use-before-define': 'error', // Disallow use before define
    '@typescript-eslint/prefer-nullish-coalescing': 'warn', // Prefer nullish coalescing operator (??) over logical OR (||)
    '@typescript-eslint/prefer-optional-chain': 'warn', // Prefer optional chaining (?.) over logical AND (&&) and OR (||)

    // Code quality & strictness
    'curly': 'error', // Enforce consistent brace style for all control statements
    'eqeqeq': ['error', 'always'], // Enforce using === and !==
    'no-var': 'error', // Disallow var declarations
    'prefer-const': 'error', // Prefer const for variables that are never reassigned
    'unused-imports/no-unused-imports': 'error', // Disallow unused imports
    'no-duplicate-imports': 'error', // Disallow duplicate imports

    // Style
    'arrow-body-style': ['error', 'as-needed'], // Enforce consistent arrow function body style
    'object-shorthand': ['error', 'always'], // Enforce object shorthand syntax
    'prefer-arrow-callback': 'error', // Prefer arrow functions for callbacks
    'spaced-comment': ['error', 'always'], // Enforce space after comment markers

    // Prettier integration
    // 'prettier/prettier': 'error', // Enforce Prettier formatting
}
