module.exports = {
  rootDir: "..",
  roots: ["<rootDir>/server"],
  testMatch: ["**/__tests__/**/*.test.js"],
  testEnvironment: "node",
  transform: {},
  clearMocks: true,
  restoreMocks: true,
  setupFiles: ["<rootDir>/server/__tests__/setup.js"],
  coverageDirectory: "<rootDir>/coverage/server",
  collectCoverageFrom: ["server/controllers/**/*.js", "server/middlewares/**/*.js", "server/utils/jwtToken.js"],
};
