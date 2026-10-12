module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  // dev-dist is the service worker vite-plugin-pwa generates in dev.
  ignorePatterns: ['dist', 'dev-dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react/jsx-no-target-blank': 'off',
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    "react/prop-types": 'off',
    'no-unused-vars': ['error', { ignoreRestSiblings: true }],
  },
  overrides: [
    {
      // Build/test config files run under Node, not the browser — they need
      // `process`/`module`/`__dirname` etc. in scope.
      files: ['*.config.js', '*.config.cjs'],
      env: { node: true },
    },
    {
      // Cypress specs run under Mocha with Cypress's own globals.
      files: ['cypress/**/*.js'],
      env: { mocha: true },
      globals: { cy: 'readonly', Cypress: 'readonly', expect: 'readonly', assert: 'readonly' },
    },
  ],
}
