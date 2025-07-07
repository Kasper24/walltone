module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],
  moduleNameMapping: {
    "^@renderer/(.*)$": "<rootDir>/src/renderer/$1",
    "^@electron/(.*)$": "<rootDir>/src/electron/$1",
    "^@components/(.*)$": "<rootDir>/src/components/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["<rootDir>/src/tests/**/*.test.{ts,tsx}", "<rootDir>/src/**/__tests__/**/*.{ts,tsx}"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/tests/**/*",
    "!src/**/__tests__/**/*",
    "!src/renderer/main.tsx",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  transform: {
    "^.+\\.(ts|tsx)$": [
      "@swc/jest",
      {
        jsc: {
          transform: {
            react: {
              runtime: "automatic",
            },
          },
        },
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"],
  },
};
