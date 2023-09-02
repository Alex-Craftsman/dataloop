/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-node',
  transform: {},
  modulePathIgnorePatterns: [
    '<rootDir>/src/',
    '<rootDir>/node_modules/',
    '<rootDir>/output/',
  ],
};
