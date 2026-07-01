// ESLint 扁平配置（ESLint 9+）。这是「就绪即用」的工件——尚未在本仓库启用。
// 启用步骤（不影响现有构建/部署，因为 npm ci 只校验依赖而非脚本）：
//   1) npm i -D eslint @eslint/js eslint-plugin-react-hooks eslint-plugin-react-refresh globals
//   2) npx eslint .            # 或在 package.json 增加 "lint": "eslint ."
//   3) 可选：在 .github/workflows/ci.yml 增加一步 `npx eslint .`（建议先设为非阻塞观察一轮）
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
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z_]' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
]
