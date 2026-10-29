// UPDATED: account cart + saved shipping address
const mongoose = require("mongoose");
const Cart = require("../models/cart");
const Product = require("../models/product");
const User = require("../models/user");
const cart = require("../controllers/cartController");
const { response } = require("./helpers");

const userA = "507f1f77bcf86cd799439011";
const p1 = "507f1f77bcf86cd799439012";
const p2 = "507f1f77bcf86cd799439013";
const call = async (handler, req) => {
  const res = response();
  const next = jest.fn();
  await handler({ params: {}, body: {}, user: { _id: userA }, ...req }, res, next);
  return { res, next };
};
const query = (value) => ({ select: jest.fn(() => ({ session: jest.fn().mockResolvedValue(value), then: (r) => r(value) })), session: jest.fn().mockResolvedValue(value) });

beforeEach(() => {
  jest.spyOn(Cart, "findOne").mockResolvedValue(null);
});

test("merge adds duplicate quantities, caps them at stock and drops unknown products", () => {
  const stock = new Map([[p1, 5], [p2, 1]]);
  const merged = cart.mergeCartItems([{ product: p1, quantity: 3 }], [{ product: p1, quantity: 4 }, { product: p2, quantity: 2 }, { product: "507f1f77bcf86cd799439099", quantity: 1 }], stock);
  expect(merged).toEqual([{ product: p1, quantity: 5 }, { product: p2, quantity: 1 }]);
});

test.each([
  { productId: "x", quantity: 1 },
  { productId: p1, quantity: 0 },
  { productId: p1, quantity: 1.5 },
  { productId: p1, quantity: "2" },
  { productId: p1, quantity: 100 },
])("invalid item %j is rejected before any write", async (body) => {
  const update = jest.spyOn(Cart, "updateOne");
  const { next } = await call(cart.setCartItem, { body });
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  expect(update).not.toHaveBeenCalled();
});

test("quantity above stock is refused", async () => {
  jest.spyOn(Product, "findById").mockReturnValue({ select: jest.fn().mockResolvedValue({ stock: 2 }) });
  const update = jest.spyOn(Cart, "updateOne");
  const { next } = await call(cart.setCartItem, { body: { productId: p1, quantity: 3 } });
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 409 }));
  expect(update).not.toHaveBeenCalled();
});

test("cart writes are scoped to the logged-in user, never a user id from the body", async () => {
  jest.spyOn(Product, "findById").mockReturnValue({ select: jest.fn().mockResolvedValue({ stock: 5 }) });
  const update = jest.spyOn(Cart, "updateOne").mockResolvedValue({ matchedCount: 1 });
  const { res } = await call(cart.setCartItem, { body: { productId: p1, quantity: 2, user: "507f1f77bcf86cd799439099" } });
  expect(update.mock.calls[0][0]).toEqual({ user: userA, "items.product": p1 });
  expect(res.json).toHaveBeenCalledWith({ success: true, cartItems: [] });
});

test("merge with an already applied mergeId does not change the cart", async () => {
  const saved = { items: [{ product: p1, quantity: 1 }], mergeIds: ["merge-abc-123"], save: jest.fn() };
  const session = { withTransaction: jest.fn(async (work) => work()), endSession: jest.fn() };
  jest.spyOn(mongoose, "startSession").mockResolvedValue(session);
  Cart.findOne.mockReturnValueOnce(query(saved)).mockResolvedValue(null);
  await call(cart.mergeCart, { body: { mergeId: "merge-abc-123", items: [{ product: p1, quantity: 2 }] } });
  expect(saved.save).not.toHaveBeenCalled();
});

test("merge rejects malformed guest carts", async () => {
  const { next } = await call(cart.mergeCart, { body: { mergeId: "short", items: [] } });
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
});

test("saved shipping address is validated and written only to the current user", async () => {
  const update = jest.spyOn(User, "updateOne").mockResolvedValue({});
  const address = { address: " Via Roma 1 ", city: "Milano", postalCode: "20121", phoneNo: "+39 333", country: "Italy" };
  await call(cart.saveShippingInfo, { body: address });
  expect(update).toHaveBeenCalledWith({ _id: userA }, { $set: { shippingInfo: { ...address, address: "Via Roma 1" } } });
  await expect(call(cart.saveShippingInfo, { body: { ...address, city: "" } })).resolves.toBeTruthy();
  expect(update).toHaveBeenCalledTimes(1);
});
