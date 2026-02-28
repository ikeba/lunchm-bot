import antfu from '@antfu/eslint-config'

export default antfu({
  rules: {
    'ts/no-namespace': 'off',
    'ts/no-require-imports': 'off',
    'perfectionist/sort-imports': 'off',
    'perfectionist/sort-exports': 'off',
    'perfectionist/sort-named-imports': 'off',
    'perfectionist/sort-named-exports': 'off',
    'antfu/consistent-chaining': 'off',
    'antfu/top-level-function': 'off',
    'antfu/consistent-list-newline': 'off',
    'antfu/if-newline': 'off',
    curly: ['error', 'all'],
    'import/order': 'off',
    'prefer-template': 'warn',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        args: 'none',
        varsIgnorePattern: '^_',
        caughtErrors: 'none',
      },
    ],

    // Padding lines between statements
    'style/padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: '*', next: 'return' },
      { blankLine: 'always', prev: ['const', 'let', 'if', 'for'], next: '*' },
      { blankLine: 'any', prev: ['const', 'let'], next: ['const', 'let'] },
    ],

    // Disable style rules handled by prettier
    'style/quote-props': 'off',
    'style/indent': 'off',
    'style/indent-binary-ops': 'off',
    'style/no-tabs': 'off',
    'style/semi': 'off',
    'style/quotes': 'off',
    'style/comma-dangle': 'off',
    'style/object-curly-spacing': 'off',
    'style/arrow-parens': 'off',
    'style/operator-linebreak': 'off',
    'style/brace-style': 'off',
    'style/member-delimiter-style': 'off',
    'style/keyword-spacing': 'off',
    'no-console': 'off',
  },
})
