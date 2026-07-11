// ESLint 扁平配置（ESLint 9+）。已在本仓库启用：
//   - devDependencies 已包含 eslint / @eslint/js / eslint-plugin-react-hooks / eslint-plugin-react-refresh / globals
//   - package.json 已提供脚本： "lint": "eslint ."  与  "lint:fix": "eslint . --fix"
//   运行前先 `npm install` 拉取上述依赖，然后 `npm run lint`。
//   CI 仍未接入（保持非阻塞）；如需可在 .github/workflows/ci.yml 增加一步 `npm run lint`（建议先设为非阻塞观察一轮）。
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  {
    ignores: [
      'dist', 'node_modules', 'public', 'coverage',
      'src/mirrorData.js', 'src/i18n/auto-en.js', 'src/i18n/translations.js',
      '**/*.timestamp-*.mjs',
    ],
  },
  {
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node, ...globals.vitest },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      // The repository predates ESLint enforcement. Surface the complete debt
      // in CI without making the first activation unusable; newly introduced
      // parse/config failures still make ESLint exit non-zero.
      ...Object.fromEntries(Object.keys(js.configs.recommended.rules).map(rule => [rule, 'warn'])),
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z_]' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
]
