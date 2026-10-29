// UPDATED: the dashboard stats are aggregated in the database, and only admins can request them
const Orders = require("../models/order");
const User = require("../models/user");
const Product = require("../models/product");
const admin = require("../controllers/adminController");
const { authorizeRole } = require("../middlewares/auth");
const { response } = require("./helpers");

test("stats use database aggregation and counts instead of loading every document", async () => {
  const aggregate = jest.spyOn(Orders, "aggregate").mockResolvedValueOnce([{ orders: 3, revenue: 300, processing: 1 }]).mockResolvedValueOnce([{ _id: { year: 2026, month: 3 }, revenue: 100, orders: 1 }]);
  const find = jest.spyOn(Orders, "find").mockReturnValue({ sort: () => ({ limit: () => ({ select: () => ({ populate: async () => [{ _id: "o1" }] }) }) }) });
  const userCount = jest.spyOn(User, "countDocuments").mockResolvedValueOnce(10).mockResolvedValueOnce(2);
  const productCount = jest.spyOn(Product, "countDocuments").mockResolvedValueOnce(20).mockResolvedValueOnce(3).mockResolvedValueOnce(4);
  jest.spyOn(Product, "find").mockReturnValue({ sort: () => ({ limit: () => ({ select: async () => [{ _id: "p1", name: "Bag", stock: 0, images: [{ url: "/b.png" }] }] }) }) });
  const res = response();
  await admin.dashboardStats({}, res, jest.fn());
  const body = res.json.mock.calls[0][0].stats;
  expect(body).toMatchObject({ revenue: 300, orders: 3, processing: 1, users: 10, newUsers: 2, products: 20, outOfStock: 3, lowStockCount: 4 });
  expect(body.monthly).toEqual([{ year: 2026, month: 3, revenue: 100, orders: 1 }]);
  expect(body.lowStock).toEqual([{ _id: "p1", name: "Bag", stock: 0, image: "/b.png" }]);
  expect(aggregate).toHaveBeenCalledTimes(2);
  expect(find.mock.calls[0]).toEqual([]); // recent orders are limited by the chain, never an unbounded find
  expect(userCount).toHaveBeenCalledTimes(2);
  expect(productCount).toHaveBeenCalledTimes(3);
});

test("non-admin users are refused by the role guard", () => {
  const next = jest.fn();
  authorizeRole("admin")({ user: { role: "user" } }, response(), next);
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
});
