const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { isAuthenticatedUser, authorizeRole } = require("../middlewares/auth");
const sendToken = require("../utils/jwtToken");
const { response } = require("./helpers");

test("missing cookie is rejected with 401 before querying users", async () => {
  const lookup = jest.spyOn(User, "findById");
  const next = jest.fn();
  await isAuthenticatedUser({ cookies: {} }, response(), next);
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  expect(lookup).not.toHaveBeenCalled();
});

test("valid session attaches its user", async () => {
  const user = { id: "user-a", role: "user" };
  jest.spyOn(User, "findById").mockResolvedValue(user);
  const req = { cookies: { token: jwt.sign({ id: user.id }, process.env.JWT_SECRET) } };
  const next = jest.fn();
  await isAuthenticatedUser(req, response(), next);
  expect(req.user).toEqual(user);
  expect(next).toHaveBeenCalledWith();
});

test("a deleted user's otherwise valid session is rejected", async () => {
  jest.spyOn(User, "findById").mockResolvedValue(null);
  const next = jest.fn();
  await isAuthenticatedUser({ cookies: { token: jwt.sign({ id: "deleted" }, process.env.JWT_SECRET) } }, response(), next);
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
});

test.each([["user", 403], ["admin", undefined]])("admin gate handles role %s", (role, statusCode) => {
  const next = jest.fn();
  authorizeRole("admin")({ user: { role } }, response(), next);
  if (statusCode) expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode }));
  else expect(next).toHaveBeenCalledWith();
});

test("login response keeps identity but excludes password hash", () => {
  const user = new User({ name: "Buyer", email: "buyer@example.test", password: "stored-hash" });
  const res = response();
  sendToken(user, 200, res);
  const body = JSON.parse(JSON.stringify(res.json.mock.calls[0][0]));
  expect(body.user.email).toBe("buyer@example.test");
  expect(body.user).not.toHaveProperty("password");
});

test("user serialization removes password recovery secrets without changing the document", () => {
  const user = new User({ name: "Buyer", password: "hash", resetPasswordToken: "private-token", resetPasswordExpire: new Date() });
  const body = JSON.parse(JSON.stringify(user));
  expect(body).not.toHaveProperty("password");
  expect(body).not.toHaveProperty("resetPasswordToken");
  expect(body).not.toHaveProperty("resetPasswordExpire");
  expect(user.password).toBe("hash");
  expect(user.resetPasswordToken).toBe("private-token");
});

test.each(["PRODUCTION", "production", "development"])("login and logout cookie settings agree in %s", async env => {
  const previous = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = env;
    const res = response();
    sendToken(new User({ name: "Buyer" }), 200, res);
    const loginOptions = res.cookie.mock.calls[0][2];
    await require("../controllers/authController").logoutUser({}, res, jest.fn());
    const logoutOptions = res.cookie.mock.calls[1][2];
    const expected = { httpOnly: true, secure: env.toLowerCase() === "production", sameSite: "lax", path: "/" };
    expect(loginOptions).toMatchObject(expected);
    expect(logoutOptions).toMatchObject(expected);
    expect(logoutOptions.expires.getTime()).toBeLessThanOrEqual(Date.now());
  } finally { process.env.NODE_ENV = previous; }
});

test.each([
  ["tampered", () => "not-a-jwt"],
  ["expired", () => jwt.sign({ id: "user-a" }, process.env.JWT_SECRET, { expiresIn: -1 })],
  ["wrong algorithm", () => jwt.sign({ id: "user-a" }, process.env.JWT_SECRET, { algorithm: "HS384" })],
  ["missing identity", () => jwt.sign({}, process.env.JWT_SECRET)],
])("rejects %s session before querying users", async (label, token) => {
  const lookup = jest.spyOn(User, "findById");
  const next = jest.fn();
  const res = response();
  await isAuthenticatedUser({ cookies: { token: token() } }, res, next);
  expect(lookup).not.toHaveBeenCalled();
  const error = next.mock.calls[0][0];
  require("../middlewares/error")(error, {}, res, jest.fn());
  expect(res.status).toHaveBeenCalledWith(401);
});

test("role gate rejects missing user instead of crashing", () => {
  const next = jest.fn();
  authorizeRole("admin")({}, response(), next);
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
});

test("saving a recovery token does not hash an unchanged password again", async () => {
  const bcrypt = require("bcryptjs");
  const hash = jest.spyOn(bcrypt, "hash").mockResolvedValue("unexpected-rehash");
  const user = User.hydrate({ _id: "507f1f77bcf86cd799439011", password: "existing-hash" });
  user.resetPasswordToken = "recovery-hash";
  jest.spyOn(User.collection, "updateOne").mockImplementation((filter, update, options, callback) => {
    callback(null, { n: 1, nModified: 1, ok: 1 });
  });
  await user.save({ validateBeforeSave: false });
  expect(hash).not.toHaveBeenCalled();
  expect(user.password).toBe("existing-hash");
});
