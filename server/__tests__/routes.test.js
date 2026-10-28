const http = require("http");
const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Product = require("../models/product");
const errorMiddleware = require("../middlewares/error");

let server;
beforeEach(async () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/v1", require("../routes/admin"));
  app.use("/api/v1", require("../routes/review"));
  app.use("/api/v1", require("../routes/auth"));
  app.use("/api/v1", require("../routes/order"));
  app.use(errorMiddleware);
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
});
afterEach(async () => {
  if (server) await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
});

function request(method, path, role, body) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (role) {
    jest.spyOn(User, "findById").mockResolvedValue({ id: "caller", _id: "caller", role });
    headers.Cookie = `token=${jwt.sign({ id: "caller" }, process.env.JWT_SECRET)}`;
  }
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: "127.0.0.1", port: server.address().port, method, path, headers, agent: false }, res => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", chunk => { body += chunk; });
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch (err) { reject(err); }
      });
    });
    req.setTimeout(2000, () => req.destroy(new Error("API response timeout")));
    req.on("error", reject);
    req.end(body ? JSON.stringify(body) : undefined);
  });
}

test.each([[undefined, 401], ["user", 403], ["admin", 200]])("admin listing permission for %s", async (role, expectedStatus) => {
  const find = jest.spyOn(Product, "find").mockResolvedValue([]);
  const result = await request("GET", "/api/v1/admin/products", role);
  expect(result.status).toBe(expectedStatus);
  if (expectedStatus === 200) expect(result.body).toEqual({ success: true, products: [] });
  else expect(find).not.toHaveBeenCalled();
});

test.each([
  ["/login", { email: { $ne: null }, password: "password" }],
  ["/login", { email: "buyer@example.test", password: ["password"] }],
  ["/password/forgot", { email: { $regex: ".*" } }],
])("rejects object/array credentials on %s before querying the database", async (path, body) => {
  const find = jest.spyOn(User, "findOne");
  const result = await request("POST", `/api/v1${path}`, undefined, body);
  expect(result.status).toBe(400);
  expect(find).not.toHaveBeenCalled();
});

test("valid login still returns identity and an auth response", async () => {
  const user = new User({ email: "buyer@example.test", password: "stored-hash", name: "Buyer" });
  user.comparePassword = jest.fn().mockResolvedValue(true);
  jest.spyOn(User, "findOne").mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
  const result = await request("POST", "/api/v1/login", undefined, { email: "buyer@example.test", password: "password" });
  expect(result.status).toBe(200);
  expect(result.body.user.email).toBe("buyer@example.test");
  expect(result.body.user).not.toHaveProperty("password");
  expect(result.body.token).toEqual(expect.any(String));
});

test("profile cannot escalate a user's role", async () => {
  const update = jest.spyOn(User, "findByIdAndUpdate").mockResolvedValue({});
  const result = await request("PUT", "/api/v1/me/update", "user", { name: "Buyer", email: "buyer@example.test", role: "admin" });
  expect(result.status).toBe(200);
  expect(update.mock.calls[0][1]).toEqual({ name: "Buyer", email: "buyer@example.test" });
});

test.each(["user", "admin"])("order route checks populated ownership for %s", async role => {
  const Orders = require("../models/order");
  jest.spyOn(Orders, "findById").mockReturnValue({ populate: jest.fn().mockResolvedValue({ user: { _id: "other-user", name: "Private" } }) });
  const result = await request("GET", "/api/v1/order/order-a", role);
  expect(result.status).toBe(role === "admin" ? 200 : 403);
  if (role === "user") expect(result.body).not.toHaveProperty("order");
});

test("owner can read an order with a populated user", async () => {
  const Orders = require("../models/order");
  jest.spyOn(Orders, "findById").mockReturnValue({ populate: jest.fn().mockResolvedValue({ user: { _id: "caller", name: "Buyer" } }) });
  const result = await request("GET", "/api/v1/order/order-a", "user");
  expect(result.status).toBe(200);
  expect(result.body.order.user.name).toBe("Buyer");
});

test("unexpected production errors do not expose internals", async () => {
  jest.spyOn(Product, "find").mockRejectedValue(new Error("database-secret-location"));
  const result = await request("GET", "/api/v1/admin/products", "admin");
  expect(result.status).toBe(500);
  expect(result.body).toEqual({ success: false, Message: "Internal Server Error" });
});

test("registration cannot assign admin privileges", async () => {
  const cloudinary = require("cloudinary");
  cloudinary.v2.uploader.upload.mockResolvedValue({ public_id: "test-avatar", secure_url: "https://example.test/avatar.png" });
  const create = jest.spyOn(User, "create").mockImplementation(async data => new User(data));
  const result = await request("POST", "/api/v1/register", undefined, {
    name: "Buyer", email: "buyer@example.test", password: "password", avatar: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=", role: "admin",
  });
  expect(result.status).toBe(200);
  expect(create.mock.calls[0][0]).not.toHaveProperty("role");
  expect(result.body.user.role).toBe("user");
  expect(result.body.user).not.toHaveProperty("password");
});

test("guest cannot delete reviews", async () => {
  const lookup = jest.spyOn(Product, "findById");
  const result = await request("DELETE", "/api/v1/reviews?productId=p&id=review", undefined);
  expect(result.status).toBe(401);
  expect(lookup).not.toHaveBeenCalled();
});

test("admin can reach review deletion", async () => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(Product, "findById").mockResolvedValue({ Reviews: [
    { _id: "removed", rating: 5 }, { _id: "kept", rating: 3 },
  ] });
  const update = jest.spyOn(Product, "findByIdAndUpdate").mockResolvedValue({});
  const result = await request("DELETE", "/api/v1/reviews?productId=p&id=removed", "admin");
  expect(result.status).toBe(200);
  expect(update.mock.calls[0][1].Reviews).toEqual([{ _id: "kept", rating: 3 }]);
});

test("ordinary user cannot delete another customer's review", async () => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(Product, "findById").mockResolvedValue({ Reviews: [
    { _id: "other-review", user: "other-user", rating: 5 },
    { _id: "remaining-review", user: "other-user", rating: 3 },
  ] });
  const update = jest.spyOn(Product, "findByIdAndUpdate").mockResolvedValue({});
  const result = await request("DELETE", "/api/v1/reviews?productId=p&id=other-review", "user");
  expect(result.status).toBe(403);
  expect(update).not.toHaveBeenCalled();
});
