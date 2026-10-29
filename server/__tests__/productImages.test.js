// UPDATED: product image management (keep / remove / reorder / add) and Cloudinary lifecycle
const cloudinary = require("cloudinary");
const Product = require("../models/product");
const products = require("../controllers/productController");
const { response } = require("./helpers");

const img = (id, extra = {}) => ({ public_id: id, url: `https://cdn.test/${id}.jpg`, toObject() { return { public_id: id, url: this.url, ...extra }; }, ...extra });
const existing = () => [img("Products/a"), img("Products/b"), img("Products/c")];
const run = async (handler, body, productDoc, params = { id: "p1" }) => {
  jest.spyOn(Product, "findById").mockResolvedValue(productDoc);
  const update = jest.spyOn(Product, "findByIdAndUpdate").mockImplementation(async (id, data) => ({ _id: id, ...data }));
  const res = response();
  const next = jest.fn();
  await handler({ params, body, user: { id: "admin" } }, res, next);
  return { res, next, update };
};
const ids = (update) => update.mock.calls[0][1].images.map((i) => i.public_id);

beforeEach(() => {
  let n = 0;
  cloudinary.v2.uploader.upload.mockImplementation(async () => ({ public_id: `Products/new${++n}`, secure_url: `https://cdn.test/new${n}.jpg` }));
  cloudinary.v2.uploader.destroy.mockResolvedValue({ result: "ok" });
});

test("removing the first image deletes only that file and the next image becomes primary", async () => {
  const { update } = await run(products.updateProduct, { order: JSON.stringify(["e:Products/b", "e:Products/c"]) }, { images: existing() });
  expect(ids(update)).toEqual(["Products/b", "Products/c"]);
  expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledTimes(1);
  expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledWith("Products/a");
});

test("removing a middle image keeps the others in place", async () => {
  const { update } = await run(products.updateProduct, { order: JSON.stringify(["e:Products/a", "e:Products/c"]) }, { images: existing() });
  expect(ids(update)).toEqual(["Products/a", "Products/c"]);
  expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledWith("Products/b");
});

test("choosing another existing image as primary only reorders (nothing is deleted or uploaded)", async () => {
  const { update } = await run(products.updateProduct, { order: JSON.stringify(["e:Products/c", "e:Products/a", "e:Products/b"]) }, { images: existing() });
  expect(ids(update)).toEqual(["Products/c", "Products/a", "Products/b"]);
  expect(cloudinary.v2.uploader.destroy).not.toHaveBeenCalled();
  expect(cloudinary.v2.uploader.upload).not.toHaveBeenCalled();
});

test("a new image appended at the end does not take over the primary slot", async () => {
  const { update } = await run(products.updateProduct, { order: JSON.stringify(["e:Products/a", "e:Products/b", "e:Products/c", "n:0"]), images: ["data:image/png;base64,AAAA"] }, { images: existing() });
  expect(ids(update)).toEqual(["Products/a", "Products/b", "Products/c", "Products/new1"]);
  expect(cloudinary.v2.uploader.destroy).not.toHaveBeenCalled();
});

test("a new image can be explicitly chosen as primary and the old files are kept", async () => {
  const { update } = await run(products.updateProduct, { order: JSON.stringify(["n:1", "n:0", "e:Products/a"]), images: ["data:x0", "data:x1"] }, { images: existing().slice(0, 1) });
  expect(ids(update)).toEqual(["Products/new1", "Products/new2", "Products/a"]);
});

test("text-only edits leave images untouched", async () => {
  const { update } = await run(products.updateProduct, { name: "New name" }, { images: existing() });
  expect(update.mock.calls[0][1].images).toBeUndefined();
  expect(cloudinary.v2.uploader.destroy).not.toHaveBeenCalled();
});

test("an image id that belongs to another product is rejected and never deleted", async () => {
  const { next, update } = await run(products.updateProduct, { order: JSON.stringify(["e:Products/other-product", "e:Products/a"]) }, { images: existing() });
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  expect(update).not.toHaveBeenCalled();
  expect(cloudinary.v2.uploader.destroy).not.toHaveBeenCalled();
});

test.each([[[]], [["e:Products/a", "e:Products/a"]], [["n:5"]], ["not json"]])("invalid image order %j is rejected", async (order) => {
  const { next, update } = await run(products.updateProduct, { order: typeof order === "string" ? order : JSON.stringify(order) }, { images: existing() });
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  expect(update).not.toHaveBeenCalled();
});

test("external seed images are never sent to Cloudinary when removed", async () => {
  const list = [img("seed/1", { provider: "external" }), img("Products/a")];
  await run(products.updateProduct, { order: JSON.stringify(["e:Products/a"]) }, { images: list });
  expect(cloudinary.v2.uploader.destroy).not.toHaveBeenCalled();
});

test("an upload failure saves nothing, deletes nothing old and removes the files already uploaded", async () => {
  cloudinary.v2.uploader.upload.mockResolvedValueOnce({ public_id: "Products/ok", secure_url: "u" }).mockRejectedValueOnce(new Error("upload failed"));
  jest.spyOn(Product, "findById").mockResolvedValue({ images: existing() });
  const update = jest.spyOn(Product, "findByIdAndUpdate");
  await expect(products.updateProduct({ params: { id: "p1" }, body: { order: JSON.stringify(["n:0", "n:1"]), images: ["a", "b"] }, user: { id: "x" } }, response(), jest.fn())).resolves.toBeUndefined();
  expect(update).not.toHaveBeenCalled();
  expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledTimes(1);
  expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledWith("Products/ok");
});

test("a database failure keeps the old images and removes only this request's uploads", async () => {
  jest.spyOn(Product, "findById").mockResolvedValue({ images: existing() });
  jest.spyOn(Product, "findByIdAndUpdate").mockRejectedValue(new Error("db down"));
  const next = jest.fn();
  await products.updateProduct({ params: { id: "p1" }, body: { order: JSON.stringify(["e:Products/a", "n:0"]), images: ["a"] }, user: { id: "x" } }, response(), next);
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "db down" }));
  expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledTimes(1);
  expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledWith("Products/new1");
});

test("a failed Cloudinary delete after saving is reported but does not undo the update", async () => {
  cloudinary.v2.uploader.destroy.mockRejectedValue(new Error("cdn down"));
  jest.spyOn(console, "error").mockImplementation(() => {});
  const { res } = await run(products.updateProduct, { order: JSON.stringify(["e:Products/b"]) }, { images: existing() });
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, cleanupFailed: 2 }));
});

test("creating a product removes its uploads when saving fails", async () => {
  jest.spyOn(Product, "create").mockRejectedValue(new Error("invalid"));
  const next = jest.fn();
  await products.newProduct({ body: { name: "x", images: ["a", "b"] }, user: { id: "admin" } }, response(), next);
  expect(next).toHaveBeenCalled();
  expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledTimes(2);
});
