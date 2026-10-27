module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  transform: { "^.+\\.[jt]sx?$": "babel-jest" },
  clearMocks: true,
  setupFiles: ["<rootDir>/test-polyfills.cjs"],
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
};
