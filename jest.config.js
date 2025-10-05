module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/engines/(.*)$': '<rootDir>/src/engines/$1',
    '^@/models/(.*)$': '<rootDir>/src/models/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/managers/(.*)$': '<rootDir>/src/managers/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  testTimeout: 30000, // Increased for performance tests
  maxWorkers: '50%', // Use half of available CPU cores
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/components/**/*.test.ts', '<rootDir>/tests/engines/**/*.test.ts', '<rootDir>/tests/managers/**/*.test.ts', '<rootDir>/tests/utils/**/*.test.ts'],
      testEnvironment: 'jsdom'
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      testEnvironment: 'jsdom'
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.ts'],
      testEnvironment: 'jsdom',
      testTimeout: 60000
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/tests/performance/**/*.test.ts'],
      testEnvironment: 'jsdom',
      testTimeout: 120000
    },
    {
      displayName: 'statistical',
      testMatch: ['<rootDir>/tests/statistical/**/*.test.ts'],
      testEnvironment: 'jsdom',
      testTimeout: 180000
    }
  ]
};