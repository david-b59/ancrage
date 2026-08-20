/**
 * Configuration ESLint (format plat).
 * Règles recommandées de JavaScript, TypeScript et des hooks React, plus
 * `eslint-config-prettier` en dernier : le formatage a une seule source de vérité,
 * Prettier, et ESLint ne discute pas ses choix.
 */
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', 'legacy'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Les préfixes `_` marquent un argument volontairement inutilisé.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // `catch {}` vide est un choix assumé partout où il apparaît : une API du
      // navigateur absente ne doit jamais interrompre une révision.
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    // Le service worker et les scripts Node ne tournent pas dans la page.
    files: ['public/sw.js', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: { ...globals.serviceworker, ...globals.node },
    },
  },
  prettier,
);
