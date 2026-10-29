const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const net = require("node:net");
const { spawn } = require("node:child_process");
const { pathToFileURL } = require("node:url");
const mongoose = require("mongoose");
const root = path.resolve(__dirname, "..");
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "shopit-e2e-"));
const database = `shopit_e2e_${crypto.randomBytes(8).toString("hex")}`;
const password = "E2e-fixture-password1!";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let mongo,
  server,
  mongoExited = false,
  cleaning = false;
const messages = [];

async function cleanup() {
  if (cleaning) return;
  cleaning = true;
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect();
  if (mongo && !mongoExited) {
    const stopped = new Promise((resolve) => mongo.once("exit", resolve));
    mongo.kill();
    await stopped;
  }
  const resolved = path.resolve(temporary);
  if (
    path.dirname(resolved) !== path.resolve(os.tmpdir()) ||
    !path.basename(resolved).startsWith("shopit-e2e-")
  )
    throw new Error("Unsafe cleanup path");
  fs.rmSync(resolved, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 200,
  });
  console.log("Temporary E2E database and build removed.");
}
async function freePort() {
  const listener = net.createServer();
  await new Promise((resolve, reject) => {
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", resolve);
  });
  const port = listener.address().port;
  await new Promise((resolve) => listener.close(resolve));
  return port;
}
async function startDatabase() {
  const port = await freePort();
  const binary =
    process.env.MONGOD_PATH ||
    (process.platform === "win32"
      ? "C:/Program Files/MongoDB/Server/8.2/bin/mongod.exe" // UPDATED: 5.0 is no longer installed
      : "mongod");
  const dbPath = path.join(temporary, "db");
  fs.mkdirSync(dbPath);
  mongo = spawn(
    binary,
    [
      "--dbpath",
      dbPath,
      "--port",
      String(port),
      "--bind_ip",
      "127.0.0.1",
      "--replSet",
      "shopitE2E",
      "--logpath",
      path.join(temporary, "mongo.log"),
    ],
    { windowsHide: true, stdio: "ignore" },
  );
  let spawnError;
  mongo.on("error", (error) => {
    spawnError = error;
    mongoExited = true;
  });
  mongo.on("exit", () => {
    mongoExited = true;
  });
  for (let attempt = 0; attempt < 30; attempt++) {
    if (spawnError) throw spawnError;
    if (mongoExited)
      throw new Error(
        "Temporary mongod exited; inspect " + path.join(temporary, "mongo.log"),
      );
    try {
      await mongoose.connect(
        `mongodb://127.0.0.1:${port}/${database}?directConnection=true`,
        { serverSelectionTimeoutMS: 1000 },
      );
      break;
    } catch (error) {
      if (attempt === 29) throw error;
      await sleep(200);
    }
  }
  await mongoose.connection.db.admin().command({
    replSetInitiate: {
      _id: "shopitE2E",
      members: [{ _id: 0, host: `127.0.0.1:${port}` }],
    },
  });
  for (let attempt = 0; attempt < 60; attempt++) {
    if (
      (await mongoose.connection.db.admin().command({ hello: 1 }))
        .isWritablePrimary
    )
      return;
    await sleep(500);
  }
  throw new Error("Temporary replica set did not elect a primary");
}
function installGatewayFixtures() {
  Object.assign(process.env, {
    NODE_ENV: "test",
    JWT_SECRET: crypto.randomBytes(32).toString("hex"),
    JWT_EXPIRES_TIME: "1h",
    COOKIE_EXPIRES_TIME: "1",
    STRIPE_SECRET_KEY: "sk_test_e2e_fixture",
    STRIPE_API_KEY: "pk_test_e2e_fixture",
    FRONTEND_URL: "http://127.0.0.1",
  });
  const cloudinary = require("cloudinary").v2;
  cloudinary.uploader.upload = async () => ({
    public_id: "e2e-fixture",
    secure_url: "/images/default_avatar.jpg",
  });
  cloudinary.uploader.destroy = async () => ({ result: "ok" });
  require("nodemailer").createTransport = () => ({
    sendMail: async (message) => {
      messages.push(message);
      return { accepted: [message.to] };
    },
  });
  const intents = new Map();
  const stripe = require("../server/utils/stripeClient")();
  stripe.paymentIntents.create = async (data) => {
    const id = "pi_e2e_" + crypto.randomBytes(8).toString("hex");
    const intent = {
      ...data,
      id,
      amount_received: data.amount,
      status: "requires_payment_method",
      client_secret: id + "_secret_fixture",
    };
    intents.set(id, intent);
    return intent;
  };
  stripe.paymentIntents.retrieve = async (id) => {
    assert(intents.has(id), "Unknown fixture payment");
    return { ...intents.get(id), status: "succeeded" };
  };
}
async function runApiChecks(base) {
  const client = () => {
    let cookie;
    return async (route, { method = "GET", body, status = 200 } = {}) => {
      const response = await fetch(base + "/api/v1" + route, {
        method,
        headers: {
          "Content-Type": "application/json", "X-ShopIT-Request": "1",
          ...(cookie ? { Cookie: cookie } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(10000),
      });
      const data = await response.json();
      assert.equal(
        response.status,
        status,
        `${method} ${route}: ${data.Message || response.status}`,
      );
      if (response.headers.get("set-cookie"))
        cookie = response.headers.get("set-cookie").split(";")[0];
      return data;
    };
  };
  const guest = client(),
    buyer = client(),
    admin = client(),
    other = client();
  await guest("/admin/products", { status: 401 });
  await buyer("/login", {
    method: "POST",
    body: { email: "buyer@example.test", password: "wrong-password" },
    status: 401,
  });
  const login = await buyer("/login", {
    method: "POST",
    body: { email: "buyer@example.test", password },
  });
  assert(!login.user.password);
  await buyer("/admin/products", { status: 403 });
  await admin("/login", {
    method: "POST",
    body: { email: "admin@example.test", password },
  });
  await other("/login", {
    method: "POST",
    body: { email: "other@example.test", password },
  });
  const catalog = await guest("/products");
  assert.equal(
    catalog.filteredProductsCount,
    require("../server/data/product.json").length,
  );
  assert.equal(catalog.products.length, Math.min(catalog.resultPerPage, catalog.filteredProductsCount));
  assert.equal(
    (await guest("/products?keyword=camera&catagory=Laptops")).count,
    0,
  );
  assert.equal((await guest("/products?keyword=camera")).count, 1);
  const created = await admin("/admin/products/new", {
    method: "POST",
    status: 201,
    body: {
      name: "E2E Camera",
      price: 100,
      description: "Temporary integration product",
      catagory: "Cameras",
      stock: 5,
      seller: "Fixture store",
      images: ["fixture"],
    },
  });
  const id = created.product._id;
  await admin(`/admin/product/${id}`, { method: "PUT", body: { price: 110 } });
  assert.equal((await guest(`/product/${id}`)).product.price, 110);
  await buyer("/review", {
    method: "PUT",
    body: { productId: id, rating: 5, comment: "Fixture review" },
  });
  let product = (await guest(`/product/${id}`)).product;
  assert.equal(product.rating, 5);
  await other(`/reviews?productId=${id}&id=${product.Reviews[0]._id}`, {
    method: "DELETE",
    status: 403,
  });
  await admin(`/reviews?productId=${id}&id=${product.Reviews[0]._id}`, {
    method: "DELETE",
  });
  assert.equal((await guest(`/product/${id}`)).product.NumOfReviews, 0);
  const shippingInfo = {
    address: "1 Test Street",
    city: "Berlin",
    postalCode: "10115",
    phoneNo: "123456789",
    country: "DE",
  };
  const checkout = {
    checkoutKey: crypto.randomBytes(16).toString("hex"),
    shippingInfo,
    orderItems: [{ product: id, quantity: 2 }],
    totalPrice: 0.01,
  };
  const payment = await buyer("/payment/process", {
    method: "POST",
    body: checkout,
  });
  assert.equal(payment.totalPrice, 231);
  const order = (
    await buyer("/order/new", {
      method: "POST",
      body: { paymentInfo: { id: payment.paymentIntentId } },
    })
  ).order;
  const retry = (
    await buyer("/order/new", {
      method: "POST",
      body: { paymentInfo: { id: payment.paymentIntentId } },
    })
  ).order;
  assert.equal(retry._id, order._id);
  assert.equal((await guest(`/product/${id}`)).product.stock, 3);
  await other(`/order/${order._id}`, { status: 403 });
  assert.equal(
    (await buyer(`/order/${order._id}`)).order.user.email,
    "buyer@example.test",
  );
  await admin(`/admin/order/${order._id}`, {
    method: "PUT",
    body: { status: "Delivered" },
  });
  assert.equal(
    (await buyer(`/order/${order._id}`)).order.orderStatus,
    "Delivered",
  );
  assert.equal((await guest(`/product/${id}`)).product.stock, 3);
  await admin(`/admin/product/${id}`, { method: "DELETE" });
  await guest(`/product/${id}`, { status: 404 });
  const registration = await guest("/register", {
    method: "POST",
    body: {
      name: "New Buyer",
      email: "registered@example.test",
      password,
      avatar:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=",
      role: "admin",
    },
  });
  assert.equal(registration.user.role, "user");
  assert(!registration.user.password);
  assert.equal(registration.user.avatar.provider, "cloudinary");
  const form = new FormData();
  form.set("name", "Multipart Buyer");
  form.set("email", "multipart@example.test");
  form.set("password", password);
  const bytes = Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    Buffer.alloc(1100000),
  ]);
  form.set("avatar", "data:image/png;base64," + bytes.toString("base64"));
  const multipart = await fetch(base + "/api/v1/register", {
    method: "POST",
    body: form,
  });
  assert.equal(multipart.status, 200);
  const multipartUser = (await multipart.json()).user;
  assert.equal(multipartUser.avatar.provider, "cloudinary");
  await guest("/password/forgot", {
    method: "POST",
    body: { email: "registered@example.test" },
  });
  const token = messages.at(-1).text.match(/password\/reset\/([a-f0-9]+)/)[1];
  await guest(`/password/reset/${token}`, {
    method: "PUT",
    body: {
      password: "Changed-fixture1!",
      confirmPassword: "Changed-fixture1!",
    },
  });
  await guest(`/password/reset/${token}`, {
    method: "PUT",
    body: { password, confirmPassword: password },
    status: 400,
  });
  await guest("/login", {
    method: "POST",
    body: { email: "registered@example.test", password: "Changed-fixture1!" },
  });
  await guest("/logout");
  await guest("/me", { status: 401 });
  console.log(
    "E2E API checks passed: permissions, login, catalog/search, product CRUD, reviews, server pricing, order ownership/idempotency/stock, registration, password reset and logout.",
  );
}
async function main() {
  installGatewayFixtures();
  await startDatabase();
  const User = require("../server/models/user");
  const Product = require("../server/models/product");
  const Orders = require("../server/models/order");
  const Checkout = require("../server/models/checkout");
  await Promise.all([
    User.init(),
    Product.init(),
    Orders.init(),
    Checkout.init(),
  ]);
  for (const [name, email, role] of [
    ["E2E Admin", "admin@example.test", "admin"],
    ["E2E Buyer", "buyer@example.test", "user"],
    ["Other Buyer", "other@example.test", "user"],
  ])
    await User.create({
      name,
      email,
      role,
      password,
      avatar: { public_id: "fixture", url: "/images/default_avatar.jpg" },
    });
  await require("../server/utils/seedProducts")();
  const { build } = await import(
    pathToFileURL(
      path.join(root, "client/node_modules/vite/dist/node/index.js"),
    )
  );
  const output = path.join(temporary, "web");
  process.env.NODE_ENV = "production";
  await build({
    root: path.join(root, "client"),
    configFile: path.join(root, "client/vite.config.mjs"),
    logLevel: "warn",
    resolve: {
      alias: {
        "@stripe/react-stripe-js": path.join(
          root,
          "client/e2e/stripe-react.jsx",
        ),
        "@stripe/stripe-js": path.join(root, "client/e2e/stripe.js"),
      },
    },
    build: { outDir: output, emptyOutDir: true },
  });
  process.env.NODE_ENV = "test";
  const html = path.join(output, "index.html");
  fs.writeFileSync(
    html,
    fs
      .readFileSync(html, "utf8")
      .replace(
        "<body>",
        '<body><div style="background:#fff3cd;padding:8px;text-align:center">E2E sandbox — payments, uploads and email are simulated</div>',
      ),
  );
  const app = require("../server/app");
  app.use(require("express").static(output));
  app.get("*", (_req, res) => res.sendFile(path.join(output, "index.html")));
  server = await new Promise((resolve, reject) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
    listener.on("error", reject);
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  await runApiChecks(base);
  if (process.argv.includes("--serve")) {
    console.log(`E2E browser fixture: ${base}`);
    console.log(
      `Test-only accounts: buyer@example.test / admin@example.test; password: ${password}`,
    );
    console.log(
      "Stripe, Cloudinary and email are simulated. Type stop or create this file to clean up: " +
        path.join(temporary, "stop"),
    );
    await new Promise((resolve) => {
      const timer = setInterval(() => {
        if (fs.existsSync(path.join(temporary, "stop"))) {
          clearInterval(timer);
          resolve();
        }
      }, 500);
      timer.unref();
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (data) => {
        if (data.trim() === "stop") resolve();
      });
      process.once("SIGINT", resolve);
      process.once("SIGTERM", resolve);
    });
    process.stdin.pause();
  }
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(cleanup);
