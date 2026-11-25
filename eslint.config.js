import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import hooks from 'eslint-plugin-react-hooks'
export default tseslint.config(
  {
    ignores: [
      'node_modules',
      'dist',
      'coverage',
      'src-tauri',
      'test-results',
      'playwright-report',
      '.tmp',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': hooks },
    rules: { 'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'error' },
  },
)
