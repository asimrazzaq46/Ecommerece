module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  transform: { "^.+\\.[jt]sx?$": "babel-jest" },
  clearMocks: true,
  moduleNameMapper: { "\\.css$": "<rootDir>/test-style-stub.cjs" },
  setupFiles: ["<rootDir>/test-polyfills.cjs"],
  setupFilesAfterEnv: ["@testing-library/jest-dom", "<rootDir>/src/i18n/index.js"],
};
