jest.mock("../utils/transaction", () => ({ inTransaction: work => work({}) }));
const Orders = require("../models/order");
const Product = require("../models/product");
const { singleOrder, newOrder, myOrders } = require("../controllers/ordersController");
const { updateOrder } = require("../controllers/adminController");
const { response } = require("./helpers");

test.each([["owner", "user", true], ["stranger", "user", false], ["stranger", "admin", true]])(
  "order visibility: %s with %s role", async (id, role, allowed) => {
    const order = { user: "owner", shippingInfo: { address: "Private address" } };
    jest.spyOn(Orders, "findById").mockReturnValue({ populate: jest.fn().mockResolvedValue(order) });
    const next = jest.fn();
    const res = response();
    await singleOrder({ params: { id: "order-a" }, user: { id, _id: id, role } }, res, next);
    if (allowed) {
      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ order }));
    } else {
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    }
  }
);

test("missing order returns 404", async () => {
  jest.spyOn(Orders, "findById").mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
  const next = jest.fn();
  await singleOrder({ params: { id: "missing" }, user: { id: "owner" } }, response(), next);
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
});

test("own-order list filters by authenticated identity", async () => {
  const find = jest.spyOn(Orders, "find").mockResolvedValue([]);
  const res = response();
  await myOrders({ user: { id: "owner" } }, res, jest.fn());
  expect(find).toHaveBeenCalledWith({ user: "owner" });
  expect(res.json).toHaveBeenCalledWith({ success: true, order: [] });
});

test("forged payment cannot persist a paid order", async () => {
  const create = jest.spyOn(Orders, "create").mockResolvedValue({});
  const next = jest.fn();
  const res = response();
  await newOrder({ user: { _id: "owner" }, body: {
    orderItems: [{ product: "product-a", quantity: 1, price: 1 }],
    totalPrice: 1, paymentInfo: { id: "fake-payment", status: "succeeded" },
  } }, res, next);
  expect(create).not.toHaveBeenCalled();
  expect(res.json).not.toHaveBeenCalled();
  expect(next).toHaveBeenCalledWith(expect.any(Error));
});

test("shipping then delivery deducts stock only once", async () => {
  const product = { stock: 10, save: jest.fn().mockResolvedValue(undefined) };
  const order = { orderStatus: "Processing", orderItems: [{ product: "product-a", quantity: 2 }], save: jest.fn().mockResolvedValue(undefined) };
  order.paymentInfo = { status: "succeeded" };
  jest.spyOn(Orders, "findById").mockReturnValue({ session: jest.fn().mockResolvedValue(order) });
  jest.spyOn(Product, "updateOne").mockImplementation(async (filter, update) => { product.stock += update.$inc.stock; return { nModified: 1 }; });
  const next = jest.fn();
  for (const status of ["Shipped", "Delivered"]) {
    await updateOrder({ params: { id: "order-a" }, body: { status } }, response(), next);
  }
  expect(next).not.toHaveBeenCalled();
  expect(product.stock).toBe(8);
});

test("order update waits for stock persistence before reporting success", async () => {
  let finish;
  const pending = new Promise(resolve => { finish = resolve; });
  const product = { stock: 10, save: jest.fn(() => pending) };
  jest.spyOn(Product, "updateOne").mockImplementation(async () => { await pending; return { nModified: 1 }; });
  jest.spyOn(Orders, "findById").mockReturnValue({ session: jest.fn().mockResolvedValue({ orderStatus: "Processing", paymentInfo: { status: "succeeded" }, orderItems: [{ product: "p", quantity: 1 }], save: jest.fn().mockResolvedValue() }) });
  const res = response();
  const update = updateOrder({ params: { id: "o" }, body: { status: "Shipped" } }, res, jest.fn());
  await new Promise(resolve => setImmediate(resolve));
  const respondedEarly = res.json.mock.calls.length > 0;
  finish();
  await update;
  expect(respondedEarly).toBe(false);
  expect(res.json).toHaveBeenCalledWith({ success: true });
});
