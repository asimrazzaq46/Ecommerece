const catalog = require("../data/product.json");
const Product = require("../models/product");
const User = require("../models/user");
const ApiFeatures = require("../utils/apiFeatures");
const seedProducts = require("../utils/seedProducts");
const reviews = require("../controllers/reviewController");
const products = require("../controllers/productController");
const cloudinary = require("cloudinary");
const { response } = require("./helpers");

test("search treats regex characters as literal text and only accepts catalog filters", () => {
  const features = new ApiFeatures(Product.find(), { keyword: "Laptop (a+b)", price: { gte: "10", lte: "200" }, catagory: "Laptops", user: "ignored", page: "2" }).search().filter().pagination(3);
  const filter = features.query.getFilter();
  expect(new RegExp(filter.name.$regex).test("Laptop (a+b)")).toBe(true);
  expect(new RegExp(filter.name.$regex).test("Laptop aaab")).toBe(false);
  expect(filter.price).toEqual({ $gte: 10, $lte: 200 });
  expect(filter.user).toBeUndefined();
  expect(features.query.options.skip).toBe(3);
});

test.each([{ page: "-1" }, { page: "1.5" }, { price: { gte: "NaN" } }, { price: { $ne: "0" } }, { keyword: {} }, { catagory: {} }])("rejects invalid catalog query %j", query => {
  expect(() => new ApiFeatures(Product.find(), query).search().filter().pagination(3)).toThrow();
});

test.each([0, 6, "NaN", {}, 2.5])("rejects invalid review rating %j before querying", async rating => {
  const find = jest.spyOn(Product, "findById");
  const next = jest.fn();
  await reviews.createProductReview({ body: { rating, comment: "Nice", productId: "p" } }, response(), next);
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  expect(find).not.toHaveBeenCalled();
});

test("review of a missing product returns 404", async () => {
  jest.spyOn(Product, "findById").mockResolvedValue(null);
  const next = jest.fn();
  await reviews.createProductReview({ body: { rating: 5, comment: "Nice", productId: "p" }, user: { id: "u", name: "User" } }, response(), next);
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
});

test("updating a review converts a string rating before averaging", async () => {
  const product = { Reviews: [{ user: "u", rating: 1, comment: "Old" }, { user: "v", rating: 3 }], save: jest.fn() };
  jest.spyOn(Product, "findById").mockResolvedValue(product);
  const next = jest.fn();
  await reviews.createProductReview({ body: { rating: "5", comment: " New ", productId: "p" }, user: { id: "u", _id: "u", name: "User" } }, response(), next);
  expect(next).not.toHaveBeenCalled();
  expect(product.rating).toBe(4);
  expect(product.Reviews[0].comment).toBe("New");
});

test("external seed images are not deleted through Cloudinary", async () => {
  const deleteOne = jest.fn();
  jest.spyOn(Product, "findById").mockResolvedValue({ images: [{ provider: "external", public_id: "seed/test" }], deleteOne });
  const next = jest.fn();
  await products.deleteProduct({ params: { id: "p" } }, response(), next);
  expect(next).not.toHaveBeenCalled();
  expect(cloudinary.v2.uploader.destroy).not.toHaveBeenCalled();
  expect(deleteOne).toHaveBeenCalled();
});

test("failed replacement upload preserves old product images", async () => {
  jest.spyOn(Product, "findById").mockResolvedValue({ images: [{ public_id: "old" }] });
  cloudinary.v2.uploader.upload.mockRejectedValue(new Error("Upload failed"));
  const update = jest.spyOn(Product, "findByIdAndUpdate");
  const next = jest.fn();
  await products.updateProduct({ params: { id: "p" }, body: { images: ["new"] } }, response(), next);
  expect(next).toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
  expect(cloudinary.v2.uploader.destroy).not.toHaveBeenCalled();
});

test("seed validates all products, uses stable IDs and never overwrites existing fields", async () => {
  const owner = "62333d079888d7c380167fe9";
  jest.spyOn(User, "findOne").mockResolvedValue({ _id: owner });
  const bulk = jest.spyOn(Product, "bulkWrite").mockResolvedValue({ upsertedCount: catalog.length });
  expect(await seedProducts({ userId: owner, dryRun: true })).toEqual({ validated: catalog.length, inserted: 0, dryRun: true });
  expect(bulk).not.toHaveBeenCalled();
  await seedProducts({ userId: owner });
  await seedProducts({ userId: owner });
  const first = bulk.mock.calls[0][0];
  const second = bulk.mock.calls[1][0];
  expect(first.map(op => String(op.updateOne.filter._id))).toEqual(second.map(op => String(op.updateOne.filter._id)));
  for (const { updateOne } of first) {
    expect(Object.keys(updateOne.update)).toEqual(["$setOnInsert"]);
    expect(updateOne.update.$setOnInsert.Reviews).toEqual([]);
    expect(updateOne.update.$setOnInsert.rating).toBe(0);
    expect(updateOne.upsert).toBe(true);
  }
});

test("seed refuses a missing admin without writing products", async () => {
  jest.spyOn(User, "findOne").mockResolvedValue(null);
  const bulk = jest.spyOn(Product, "bulkWrite");
  await expect(seedProducts({ userId: "62333d079888d7c380167fe9" })).rejects.toThrow("existing admin");
  expect(bulk).not.toHaveBeenCalled();
});

test("failed avatar upload leaves the old avatar intact", async () => {
  jest.spyOn(User, "findById").mockResolvedValue({ avatar: { public_id: "old" } });
  cloudinary.v2.uploader.upload.mockRejectedValue(new Error("Upload failed"));
  const update = jest.spyOn(User, "findByIdAndUpdate");
  const next = jest.fn();
  await require("../controllers/authController").updateProfile({ user: { id: "u" }, body: { avatar: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=" } }, response(), next);
  expect(next).toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
  expect(cloudinary.v2.uploader.destroy).not.toHaveBeenCalled();
});

test("failed profile save cleans up only the replacement avatar", async () => {
  jest.spyOn(User, "findById").mockResolvedValue({ avatar: { public_id: "old" } });
  cloudinary.v2.uploader.upload.mockResolvedValue({ public_id: "new", secure_url: "https://example.com/new.jpg" });
  cloudinary.v2.uploader.destroy.mockResolvedValue({ result: "ok" });
  jest.spyOn(User, "findByIdAndUpdate").mockRejectedValue(new Error("Save failed"));
  const next = jest.fn();
  await require("../controllers/authController").updateProfile({ user: { id: "u" }, body: { avatar: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=" } }, response(), next);
  expect(next).toHaveBeenCalled();
  expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledTimes(1);
  expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledWith("new");
});
