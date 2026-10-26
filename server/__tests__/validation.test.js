const validateAuth = require("../middlewares/validateAuth");
const { response } = require("./helpers");

test.each([
  ["register", { name: "Buyer", email: "buyer@example.test", password: "password", avatar: "https://internal-host/image" }],
  ["register", { name: "Buyer", email: "buyer@example.test", password: "short", avatar: "data:image/png;base64,YQ==" }],
  ["reset", { password: "x".repeat(73), confirmPassword: "x".repeat(73) }],
  ["password", { oldPassword: { $ne: "" }, password: "password" }],
  ["profile", { name: { $set: "Buyer" }, email: "buyer@example.test" }],
  ["admin", { name: "Buyer", email: "buyer@example.test", role: "superadmin" }],
])("invalid %s input is rejected", (action, body) => {
  const next = jest.fn();
  validateAuth(action)({ body }, response(), next);
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
});

test.each([
  ["register", { name: "Buyer", email: "buyer@example.test", password: "password", avatar: "data:image/png;base64,YQ==" }],
  ["reset", { password: "password", confirmPassword: "password" }],
  ["password", { oldPassword: "old-password", password: "password" }],
  ["profile", { name: "Buyer", email: "buyer@example.test", avatar: "" }],
  ["admin", { name: "Buyer", email: "buyer@example.test", role: "admin" }],
])("valid %s form reaches its controller", (action, body) => {
  const next = jest.fn();
  validateAuth(action)({ body }, response(), next);
  expect(next).toHaveBeenCalledWith();
});
