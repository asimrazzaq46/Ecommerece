// UPDATED: unsafe admin operations are refused
const User = require("../models/user");
const Cart = require("../models/cart");
const admin = require("../controllers/adminController");
const { response } = require("./helpers");

const me = { _id: "507f1f77bcf86cd799439011" };
const run = async (handler, req) => {
  const next = jest.fn();
  const res = response();
  await handler({ params: {}, body: {}, user: me, ...req }, res, next);
  return { next, res };
};

test("an admin cannot delete their own account", async () => {
  const find = jest.spyOn(User, "findById");
  const { next } = await run(admin.deleteUser, { params: { id: me._id } });
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  expect(find).not.toHaveBeenCalled();
});

test("another admin must be demoted before deletion", async () => {
  const deleteOne = jest.fn();
  jest.spyOn(User, "findById").mockResolvedValue({ role: "admin", deleteOne });
  const { next } = await run(admin.deleteUser, { params: { id: "507f1f77bcf86cd799439022" } });
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  expect(deleteOne).not.toHaveBeenCalled();
});

test("deleting a customer also removes their account cart", async () => {
  const deleteOne = jest.fn();
  const user = { _id: "507f1f77bcf86cd799439022", role: "user", avatar: { provider: "default" }, deleteOne };
  jest.spyOn(User, "findById").mockResolvedValue(user);
  const cart = jest.spyOn(Cart, "deleteOne").mockResolvedValue({});
  const { res } = await run(admin.deleteUser, { params: { id: user._id } });
  expect(deleteOne).toHaveBeenCalled();
  expect(cart).toHaveBeenCalledWith({ user: user._id });
  expect(res.status).toHaveBeenCalledWith(200);
});

test("an admin cannot remove their own admin role", async () => {
  const update = jest.spyOn(User, "findByIdAndUpdate");
  const { next } = await run(admin.updateUser, { params: { id: me._id }, body: { name: "A", email: "a@b.co", role: "user" } });
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  expect(update).not.toHaveBeenCalled();
});
