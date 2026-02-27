/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  // Override module to CommonJS for Jest — tsconfig.base uses NodeNext which ts-jest can't handle
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'CommonJS',
        moduleResolution: 'Node',
      },
    }],
  },
  moduleNameMapper: {
    '^@careequity/core$': '<rootDir>/packages/core/src',
    '^@careequity/core/(.*)$': '<rootDir>/packages/core/src/$1',
    '^@careequity/db$': '<rootDir>/packages/db/src',
    '^@careequity/db/(.*)$': '<rootDir>/packages/db/src/$1',
    '^@careequity/ui$': '<rootDir>/packages/ui/src',
    '^@careequity/ui/(.*)$': '<rootDir>/packages/ui/src/$1',
  },
  // Only run source tests, not compiled dist output
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],
  testMatch: ['**/src/**/__tests__/**/*.test.ts', '**/src/**/*.spec.ts'],
};
