const mongoose = require("mongoose");
const Product = require("../models/product");
const Checkout = require("../models/checkout");
const Orders = require("../models/order");
const stripe = require("../utils/stripeClient");
const { validateCheckout, priceCheckout } = require("../utils/checkout");
const { processPayment } = require("../controllers/paymentController");
const completeOrder = require("../services/completeOrder");
const { response } = require("./helpers");

const userId = "507f1f77bcf86cd799439011";
const productId = "507f1f77bcf86cd799439012";
const checkoutId = "507f1f77bcf86cd799439013";
const shippingInfo = { address: "1 Test Street", city: "Berlin", postalCode: "10115", phoneNo: "123456", country: "DE" };
const request = { orderItems: [{ product: productId, quantity: 2, price: 0.01 }], shippingInfo };
let session, checkout, payment;

beforeEach(() => {
  session = { withTransaction: jest.fn(async work => work()), endSession: jest.fn() };
  jest.spyOn(mongoose, "startSession").mockResolvedValue(session);
  checkout = { _id: checkoutId, user: userId, paymentIntentId: "pi_test", completed: false, save: jest.fn().mockResolvedValue(),
    quote: { orderItems: [{ product: productId, name: "Product", image: "https://example.test/p.png", price: 100, quantity: 2 }], shippingInfo,
      itemsPrice: 200, taxPrice: 10, shippingPrice: 25, totalPrice: 235 } };
  payment = { id: "pi_test", status: "succeeded", currency: "usd", amount: 23500, amount_received: 23500, metadata: { userId, checkoutId } };
  stripe().paymentIntents.retrieve.mockResolvedValue(payment);
  jest.spyOn(Checkout, "findById").mockReturnValue({ session: jest.fn().mockResolvedValue(checkout) });
  jest.spyOn(Orders, "findById").mockReturnValue({ session: jest.fn().mockResolvedValue(null) });
  jest.spyOn(Product, "updateOne").mockResolvedValue({ modifiedCount: 1 });
  jest.spyOn(Orders, "create").mockImplementation(async docs => docs);
});

test("server prices products and ignores client totals", async () => {
  jest.spyOn(Product, "findById").mockResolvedValue({ name: "Product", price: 100, stock: 5, images: [{ url: "image" }] });
  const quote = await priceCheckout(validateCheckout({ ...request, totalPrice: 0.01 }));
  expect(quote.totalPrice).toBe(235);
  expect(quote.orderItems[0].price).toBe(100);
});

test("free shipping applies only above $200", async () => {
  jest.spyOn(Product, "findById").mockResolvedValue({ name: "Product", price: 100.01, stock: 5, images: [{ url: "image" }] });
  const quote = await priceCheckout(validateCheckout(request));
  expect(quote).toMatchObject({ itemsPrice: 200.02, shippingPrice: 0, taxPrice: 10, totalPrice: 210.02 });
});

test.each([0, -1, 1.5, "2", Number.MAX_SAFE_INTEGER + 1])("invalid quantity %s cannot reach pricing", quantity => {
  expect(() => validateCheckout({ ...request, orderItems: [{ product: productId, quantity }] })).toThrow("Invalid product or quantity");
});

test("duplicate products are rejected", () => {
  expect(() => validateCheckout({ ...request, orderItems: [request.orderItems[0], request.orderItems[0]] })).toThrow();
});

test("stock shortage is rejected before payment", async () => {
  jest.spyOn(Product, "findById").mockResolvedValue({ price: 100, stock: 1 });
  await expect(priceCheckout(validateCheckout(request))).rejects.toMatchObject({ statusCode: 409 });
});

test("verified payment saves trusted snapshot and deducts stock in one transaction", async () => {
  const order = await completeOrder("pi_test", userId);
  expect(order).toMatchObject({ _id: checkoutId, totalPrice: 235, stockDeducted: true, paymentInfo: { id: "pi_test", status: "succeeded" } });
  expect(Product.updateOne).toHaveBeenCalledWith({ _id: productId, stock: { $gte: 2 } }, { $inc: { stock: -2 } }, { session });
  expect(Orders.create.mock.calls[0][1]).toEqual({ session });
  expect(checkout.save).toHaveBeenCalledWith({ session });
  expect(checkout.completed).toBe(true);
  expect(session.endSession).toHaveBeenCalled();
});

test.each([
  { status: "processing" }, { currency: "eur" }, { amount: 1 }, { amount_received: 1 },
  { metadata: { userId: "someone-else", checkoutId } },
])("unverified payment %j is rejected without writing stock", async changes => {
  Object.assign(payment, changes);
  await expect(completeOrder("pi_test", userId)).rejects.toMatchObject({ statusCode: 400 });
  expect(Product.updateOne).not.toHaveBeenCalled();
  expect(Orders.create).not.toHaveBeenCalled();
});

test("retry returns existing order without deducting again", async () => {
  jest.spyOn(Orders, "findById").mockReturnValue({ session: jest.fn().mockResolvedValue({ _id: checkoutId }) });
  await expect(completeOrder("pi_test", userId)).resolves.toEqual({ _id: checkoutId });
  expect(Product.updateOne).not.toHaveBeenCalled();
  expect(Orders.create).not.toHaveBeenCalled();
});

test("deleting an order cannot make its payment reusable", async () => {
  checkout.completed = true;
  await expect(completeOrder("pi_test", userId)).rejects.toMatchObject({ statusCode: 409 });
  expect(Product.updateOne).not.toHaveBeenCalled();
});

test("stock race fails transaction and never reports an order", async () => {
  Product.updateOne.mockResolvedValue({ modifiedCount: 0 });
  await expect(completeOrder("pi_test", userId)).rejects.toMatchObject({ statusCode: 409 });
  expect(Orders.create).not.toHaveBeenCalled();
  expect(checkout.save).not.toHaveBeenCalled();
  expect(session.endSession).toHaveBeenCalled();
});

test("database error propagates out of transaction for rollback", async () => {
  Orders.create.mockRejectedValue(new Error("write failed"));
  await expect(completeOrder("pi_test", userId)).rejects.toThrow("write failed");
  expect(checkout.save).not.toHaveBeenCalled();
  expect(session.endSession).toHaveBeenCalled();
});

test("unsupported database blocks payment creation", async () => {
  const old = mongoose.connection.db;
  try {
    mongoose.connection.db = { admin: () => ({ command: jest.fn().mockResolvedValue({}) }) };
    const next = jest.fn();
    await processPayment({ body: { ...request, checkoutKey: "test-checkout-key-1234" }, user: { _id: userId } }, response(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 503 }));
    expect(stripe().paymentIntents.create).not.toHaveBeenCalled();
  } finally { mongoose.connection.db = old; }
});

test("repeated checkout requests reuse the same payment and trusted amount", async () => {
  const old = mongoose.connection.db;
  try {
    mongoose.connection.db = { admin: () => ({ command: jest.fn().mockResolvedValue({ setName: "test-rs" }) }) };
    let stored;
    Checkout.findById.mockImplementation(async () => stored);
    jest.spyOn(Product, "findById").mockResolvedValue({ name: "Product", price: 100, stock: 5, images: [{ url: "image" }] });
    jest.spyOn(Checkout, "findOneAndUpdate").mockImplementation(async (filter, update) => {
      stored = { _id: filter._id, ...update.$setOnInsert, save: jest.fn().mockResolvedValue() };
      return stored;
    });
    stripe().paymentIntents.create.mockResolvedValue({ id: "pi_test", client_secret: "test-secret", status: "requires_payment_method" });
    stripe().paymentIntents.retrieve.mockResolvedValue({ id: "pi_test", client_secret: "test-secret", status: "requires_payment_method" });
    const next = jest.fn();
    const req = { user: { _id: userId }, body: { ...request, checkoutKey: "test-checkout-key-1234", amount: 1 } };
    const res = response();
    await processPayment(req, res, next);
    await processPayment(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(stripe().paymentIntents.create).toHaveBeenCalledTimes(1);
    expect(stripe().paymentIntents.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 23500, currency: "usd", automatic_payment_methods: { enabled: true, allow_redirects: "never" }, capture_method: "automatic", metadata: { userId, checkoutId: stored._id } }), { idempotencyKey: `checkout-${stored._id}` });
    expect(res.json.mock.calls[1][0]).toMatchObject({ totalPrice: 235, paymentIntentId: "pi_test" });
    req.body = { ...req.body, orderItems: [{ product: productId, quantity: 1 }] };
    await processPayment(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 409 }));
    expect(stripe().paymentIntents.create).toHaveBeenCalledTimes(1);
  } finally { mongoose.connection.db = old; }
});
