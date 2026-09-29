import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

/**
 * eslint-config-next 16 ships a native flat config, so it is composed directly
 * rather than through FlatCompat (which cannot serialise the plugin graph).
 */
const config = [
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Unused arguments are legitimate for interface conformance and for
      // deliberately-ignored callback params; require the `_` convention.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // The interaction test must install its Next.js module stubs *before* the
    // components under test import `next/navigation`. Static `import` hoists
    // above that setup, so it has to use require() to control load order.
    files: ['tests/interaction.test.tsx'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];

export default config;
