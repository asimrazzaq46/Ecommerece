const http = require("http");
const bcrypt = require("bcryptjs");

test("bcrypt upgrade still accepts an existing bcryptjs 2 hash", async () => {
  const hash = "$2a$10$elqY2g04y13OFxAHhb9AN./ZbFdVzDChrAzvsebLj6yRVv1PRCOO2";
  await expect(bcrypt.compare("migration-test-password", hash)).resolves.toBe(true);
  await expect(bcrypt.compare("wrong-password", hash)).resolves.toBe(false);
});

test("Nodemailer renders recovery mail without contacting an SMTP server", async () => {
  const nodemailer = jest.requireActual("nodemailer");
  const transport = nodemailer.createTransport({ jsonTransport: true });
  const result = await transport.sendMail({ from: "ShopIT <shop@example.test>", to: "buyer@example.test", subject: "Password recovery", text: "Reset: https://example.test/reset/test-token" });
  const message = JSON.parse(result.message);
  expect(message.to[0].address).toBe("buyer@example.test");
  expect(message.text).toContain("/reset/test-token");
  transport.close();
});

test("Stripe SDK preserves card intent fields, API version and idempotency on the wire", async () => {
  const Stripe = jest.requireActual("stripe");
  const requests = [];
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      requests.push({ method: req.method, path: req.url, headers: req.headers, body: new URLSearchParams(body) });
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ id: "pi_fixture", amount: 23500, currency: "usd", status: "requires_payment_method", client_secret: "fixture", metadata: { userId: "u", checkoutId: "c" } }));
    });
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const stripe = new Stripe("sk_test_local_fixture", { host: "127.0.0.1", port: server.address().port, protocol: "http", apiVersion: "2026-09-30.endive", maxNetworkRetries: 0 });
    await stripe.paymentIntents.create({ amount: 23500, currency: "usd", automatic_payment_methods: { enabled: true, allow_redirects: "never" }, capture_method: "automatic", metadata: { userId: "u", checkoutId: "c" } }, { idempotencyKey: "checkout-c" });
    const payment = await stripe.paymentIntents.retrieve("pi_fixture");
    expect(requests[0].headers["stripe-version"]).toBe("2026-09-30.endive");
    expect(requests[0].headers["idempotency-key"]).toBe("checkout-c");
    expect(requests[0].body.has("payment_method_types[0]")).toBe(false);
    expect(requests[0].body.get("automatic_payment_methods[enabled]")).toBe("true");
    expect(requests[0].body.get("automatic_payment_methods[allow_redirects]")).toBe("never");
    expect(requests[0].body.get("capture_method")).toBe("automatic");
    expect(requests[0].body.get("metadata[userId]")).toBe("u");
    expect(requests[1].path).toBe("/v1/payment_intents/pi_fixture");
    expect(payment.amount).toBe(23500);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});

test("upgraded multipart middleware preserves repeated product image fields", async () => {
  const User = require("../models/user");
  const Product = require("../models/product");
  const cloudinary = require("cloudinary");
  const jwt = require("jsonwebtoken");
  jest.spyOn(User, "findById").mockResolvedValue({ id: "admin", role: "admin" });
  cloudinary.v2.uploader.upload.mockImplementation(async image => ({ public_id: image, secure_url: `https://example.test/${image}` }));
  const create = jest.spyOn(Product, "create").mockImplementation(async data => data);
  const app = require("../app");
  const server = await new Promise(resolve => { const s = app.listen(0, "127.0.0.1", () => resolve(s)); });
  try {
    const boundary = "shopit-multipart-fixture";
    const fields = [["name", "Camera & accessories"], ["images", "first-image"], ["images", "second-image"]];
    const body = fields.map(([name, value]) => `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`).join("") + `--${boundary}--\r\n`;
    const response = await new Promise((resolve, reject) => {
      const req = http.request({ hostname: "127.0.0.1", port: server.address().port, path: "/api/v1/admin/products/new", method: "POST", headers: {
        Cookie: `token=${jwt.sign({ id: "admin" }, process.env.JWT_SECRET)}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`, "Content-Length": Buffer.byteLength(body),
      } }, res => { res.resume(); res.on("end", () => resolve(res)); });
      req.on("error", reject);
      req.end(body);
    });
    expect(response.statusCode).toBe(201);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ name: "Camera & accessories", images: [
      { public_id: "first-image", url: "https://example.test/first-image" },
      { public_id: "second-image", url: "https://example.test/second-image" },
    ] }));
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
