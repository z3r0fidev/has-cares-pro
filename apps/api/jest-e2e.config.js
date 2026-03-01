/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
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
    // Mock all TensorFlow packages — AIModerator is not exercised in E2E search tests
    // and its shouldFlag() already catches & swallows errors, so a no-op stub is safe.
    '^@tensorflow.*': '<rootDir>/__mocks__/tensorflow.js',
    '^@tensorflow-models.*': '<rootDir>/__mocks__/tensorflow.js',
  },
  rootDir: '.',
  testMatch: ['**/test/**/*.e2e-spec.ts'],
};
