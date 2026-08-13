import eslintPlugin from 'eslint-plugin-eslint-plugin'
import importPlugin from 'eslint-plugin-import'
import jsdoc from 'eslint-plugin-jsdoc'
import perfectionist from 'eslint-plugin-perfectionist'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'

import commentSlop from './src/index.js'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'node_modules', 'tsup.config.bundled_*.mjs']),
  tseslint.configs.strictTypeChecked,
  eslintPlugin.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      'comment-slop': commentSlop,
      import: importPlugin,
      jsdoc,
      perfectionist,
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unsafe-type-assertion': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'comment-slop/write-good': 'error',
      'comment-slop/write-short': ['error', 120],
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: ['*.config.*', '**/*.test.*', 'scripts/**/*'],
          optionalDependencies: false,
          peerDependencies: true,
        },
      ],
      'jsdoc/require-description': 'error',
      'jsdoc/require-jsdoc': [
        'error',
        {
          enableFixer: false,
          publicOnly: true,
          require: { ArrowFunctionExpression: true, FunctionDeclaration: true, FunctionExpression: true },
        },
      ],
      'no-redeclare': 'off',
      'no-unused-vars': 'off',
      'no-useless-rename': 'error',
      'perfectionist/sort-imports': ['error'],
      'perfectionist/sort-interfaces': ['error'],
      'perfectionist/sort-objects': ['error', { type: 'alphabetical' }],
    },
    settings: {
      'import/resolver': {
        node: true,
        typescript: true,
      },
    },
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-type-assertion': 'off',
      'jsdoc/require-jsdoc': 'off',
    },
  },
])
