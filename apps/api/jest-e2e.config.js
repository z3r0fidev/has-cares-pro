/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'CommonJS',
        moduleResolution: 'Node',
      },
    }],
  },
  moduleNameMapper: {
    // Exact package root → src/index
    '^@careequity/core$': '<rootDir>/../../packages/core/src',
    // Deep paths (e.g. @careequity/core/src/search/client) resolve via the
    // workspace symlink: node_modules/@careequity/core → packages/core/
    '^@careequity/core/(.*)$': '<rootDir>/../../packages/core/$1',
    '^@careequity/db$': '<rootDir>/../../packages/db/src',
    '^@careequity/db/(.*)$': '<rootDir>/../../packages/db/$1',
  },
  rootDir: '.',
  testMatch: ['**/test/**/*.e2e-spec.ts'],
};
