const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const path = require("node:path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../server/config/config.env"), quiet: true });
const app = require("../server/app");
const User = require("../server/models/user");
const Product = require("../server/models/product");
const seedProducts = require("../server/utils/seedProducts");

// Only this freshly generated, local test database is written or removed.
const database = `shopit_migration_test_${crypto.randomBytes(8).toString("hex")}`;
let server;
async function run() {
  if (!/^mongodb:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(process.env.DB_LOCAL_URL || "")) {
    throw new Error("Database tests require a local mongodb://localhost or 127.0.0.1 URI");
  }
  await mongoose.connect(process.env.DB_LOCAL_URL, { dbName: database, serverSelectionTimeoutMS: 5000 });
  await User.init();
  const user = await User.create({ name: "Migration Admin", email: "migration@example.test", password: "fixture-password", role: "admin", avatar: { public_id: "fixture", url: "https://example.test/avatar.png" } });
  assert(await user.comparePassword("fixture-password"));
  const hash = user.password;
  user.resetPasswordToken = "fixture-token";
  await user.save();
  assert.equal(user.password, hash, "unmodified passwords must not be rehashed");

  assert.equal((await seedProducts({ userId: String(user._id) })).inserted, 6);
  const product = await Product.findOne();
  await Product.updateOne({ _id: product._id }, { $set: { stock: 7 } });
  const before = JSON.stringify(await Product.find().sort({ _id: 1 }).lean());
  assert.equal((await seedProducts({ userId: String(user._id) })).inserted, 0);
  assert.equal(JSON.stringify(await Product.find().sort({ _id: 1 }).lean()), before);
  const result = await Product.updateOne({ _id: product._id, stock: { $gte: 2 } }, { $inc: { stock: -2 } });
  assert.equal(result.modifiedCount, 1);
  assert.equal((await Product.findById(product._id)).stock, 5);
  const populated = await Product.findById(product._id).populate("user", "name");
  assert.equal(populated.user.name, "Migration Admin");

  const topology = await mongoose.connection.db.admin().command({ hello: 1 });
  if (topology.setName) {
    const Checkout = require("../server/models/checkout");
    const Orders = require("../server/models/order");
    const { priceCheckout } = require("../server/utils/checkout");
    await Checkout.init();
    await Orders.init();
    process.env.STRIPE_SECRET_KEY = "sk_test_local_fixture";
    const stripe = require("../server/utils/stripeClient")();
    const completeOrder = require("../server/services/completeOrder");
    const shippingInfo = { address: "Test Street", city: "Test City", phoneNo: "123456789", postalCode: "10000", country: "US" };
    const quote = await priceCheckout({ orderItems: [{ product: String(product._id), quantity: 2 }], shippingInfo });
    const checkout = await Checkout.create({ user: user._id, requestHash: "fixture", quote, paymentIntentId: "pi_fixture_paid" });
    stripe.paymentIntents.retrieve = async () => ({ id: "pi_fixture_paid", status: "succeeded", currency: "usd", amount: Math.round(quote.totalPrice * 100), amount_received: Math.round(quote.totalPrice * 100), metadata: { userId: String(user._id), checkoutId: String(checkout._id) } });
    const order = await completeOrder("pi_fixture_paid", String(user._id));
    assert.equal((await Product.findById(product._id)).stock, 3);
    assert.equal(String((await completeOrder("pi_fixture_paid", String(user._id)))._id), String(order._id));
    assert.equal((await Product.findById(product._id)).stock, 3);
    const shortage = await Checkout.create({ user: user._id, requestHash: "shortage", quote: { ...quote, orderItems: [...quote.orderItems, { ...quote.orderItems[0], quantity: 99 }] }, paymentIntentId: "pi_fixture_shortage" });
    stripe.paymentIntents.retrieve = async () => ({ id: "pi_fixture_shortage", status: "succeeded", currency: "usd", amount: Math.round(quote.totalPrice * 100), amount_received: Math.round(quote.totalPrice * 100), metadata: { userId: String(user._id), checkoutId: String(shortage._id) } });
    await assert.rejects(completeOrder("pi_fixture_shortage", String(user._id)), error => error.statusCode === 409);
    assert.equal((await Product.findById(product._id)).stock, 3, "failed transaction must roll back its first stock write");
    assert.equal(await Orders.findById(shortage._id), null);
    assert.equal((await Checkout.findById(shortage._id)).completed, false);
    console.log("Replica-set checks passed: paid-order persistence, idempotency and stock rollback (Stripe responses are fixtures).");
  } else {
    console.log("Transaction checks skipped: local MongoDB is standalone.");
  }

  server = await new Promise(resolve => { const s = app.listen(0, "127.0.0.1", () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  let cookie;
  async function request(route, method = "GET", body) {
    const response = await fetch(base + route, { method, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(5000) });
    const data = await response.json();
    assert.equal(response.status, 200, `${method} ${route}: ${data.Message || response.status}`);
    return { response, data };
  }
  const login = await request("/login", "POST", { email: user.email, password: "fixture-password" });
  cookie = login.response.headers.get("set-cookie").split(";")[0];
  assert(!login.data.user.password);
  const page = (await request("/products?page=1")).data;
  assert.equal(page.count, 3);
  assert.equal(page.filteredProductsCount, 6);
  const filtered = (await request("/products?catagory=Laptops&price[lte]=1000")).data;
  assert.equal(filtered.count, 1);
  await request("/review", "PUT", { productId: String(product._id), rating: 5, comment: "Migration review" });
  const reviewed = await Product.findById(product._id);
  assert.equal(reviewed.rating, 5);
  await request(`/reviews?productId=${product._id}&id=${reviewed.Reviews[0]._id}`, "DELETE");
  assert.equal((await Product.findById(product._id)).rating, 0);
  await request(`/admin/product/${product._id}`, "PUT", { price: 25, stock: 4 });
  assert.equal((await Product.findById(product._id)).price, 25);
  await request(`/admin/product/${product._id}`, "DELETE");
  assert.equal(await Product.findById(product._id), null);
  console.log("Database integration passed: authentication, password hooks, seed reruns, stock writes, population, catalog queries, reviews and product CRUD.");
}

run().catch(error => {
  console.error("Database integration failed:", error.message);
  process.exitCode = 1;
}).finally(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
  try {
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === database && /^shopit_migration_test_[a-f0-9]{16}$/.test(database)) {
      await mongoose.connection.dropDatabase();
    }
  } finally {
    await mongoose.disconnect();
  }
});
