import setemiojo from '@setemiojo/eslint-config'

export default setemiojo({
  react: true,
  ts: true,
  tanstackRouter: true,
  tsconfigPath: './tsconfig.json',
  rules: {
    'ts/only-throw-error': 'off',
  },
})
