export default {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/**/*.test.mjs'
  ],
  moduleFileExtensions: ['mjs', 'js', 'json', 'node'],
  transform: {},
  collectCoverageFrom: [
    'src/**/*.mjs'
  ]
}
