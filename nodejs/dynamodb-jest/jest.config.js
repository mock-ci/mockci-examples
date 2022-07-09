/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  silent: false,
  verbose: true,
  detectOpenHandles: true,
  maxConcurrency: 10,
  maxWorkers: '50%',
};