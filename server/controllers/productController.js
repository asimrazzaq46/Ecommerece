const cloudinary = require("cloudinary");

const Product = require("../models/product");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncError = require("../middlewares/catchAsyncError");
const ApiFeature = require("../utils/apiFeatures");

// UPDATED: only these fields are writable; user, rating and Reviews stay server-controlled.
const editable = (body) =>
  Object.fromEntries(
    ["name", "price", "description", "catagory", "seller", "stock"]
      .filter((key) => body[key] !== undefined)
      .map((key) => [key, body[key]]),
  );


// UPDATED: image helpers. Cloudinary ids are never trusted from the client: the client only says which of the
// product's OWN current images to keep (by public_id) and in what order; everything else is resolved here.
const MAX_IMAGES = 20;
const asList = (value) => (value === undefined ? [] : Array.isArray(value) ? value : [value]);
const parseJson = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};
const uploadImage = async (data, uploaded) => {
  const result = await cloudinary.v2.uploader.upload(data, { folder: "Products" });
  const image = { public_id: result.public_id, url: result.secure_url };
  uploaded.push(image);
  return image;
};
// Best-effort cleanup of files we uploaded or removed; failures are logged, never thrown (the DB stays consistent).
const destroyImages = async (images) => {
  const targets = images.filter((image) => image.provider !== "external" && image.public_id);
  const results = await Promise.allSettled(targets.map((image) => cloudinary.v2.uploader.destroy(image.public_id)));
  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed) console.error(`Cloudinary cleanup failed for ${failed} image(s)`);
  return failed;
};

// create new product => /api/v1/admin/products/new

exports.newProduct = catchAsyncError(async (req, res, next) => {
  let images = [];
  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  if (
    !Array.isArray(images) ||
    !images.length ||
    images.some((image) => typeof image !== "string")
  ) {
    return next(new ErrorHandler("Please provide product images", 400));
  }
  // UPDATED: the client sends images in display order (first = main image); roll uploads back on failure
  const imagesLinks = [];
  let product;
  try {
    for (const data of images) await uploadImage(data, imagesLinks);
    product = await Product.create({
      ...editable(req.body),
      images: imagesLinks,
      // taking the id from user model and assigning to user in product model
      user: req.user.id,
    });
  } catch (error) {
    await destroyImages(imagesLinks);
    throw error;
  }
  res.status(201).json({
    success: true,
    product,
  });
});

// get all products from the database => /api/v1/products

exports.getProducts = catchAsyncError(async (req, res, next) => {
  const resultPerPage = 12;

  const productCount = await Product.countDocuments();

  const apiFeatures = new ApiFeature(Product.find(), req.query)
    .search()
    .filter();

  const filteredProductsCount = await Product.countDocuments(
    apiFeatures.query.getFilter(),
  );

  apiFeatures.pagination(resultPerPage);

  const products = await apiFeatures.query;

  res.status(200).json({
    success: true,
    count: products.length,
    productCount,
    resultPerPage,
    filteredProductsCount,
    products,
  });
});

// find one product => /api/v1/product/:id

exports.getSingleProduct = catchAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("product not exist", 404));
  }
  res.status(200).json({
    success: true,
    product,
  });
});

// update the product => /api/v1/admin/product/:id

exports.updateProduct = catchAsyncError(async (req, res, next) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler("product not exist", 404));
  }

  const update = editable(req.body);
  const uploaded = [];
  let removed = [];

  if (req.body.order !== undefined) {
    // UPDATED: mixed list of kept + new images. Tokens: "e:<public_id>" (existing) or "n:<index>" (new upload).
    const order = parseJson(req.body.order);
    const incoming = asList(req.body.images);
    if (!Array.isArray(order) || order.length < 1 || order.length > MAX_IMAGES || order.some((t) => typeof t !== "string") ||
        new Set(order).size !== order.length || incoming.some((data) => typeof data !== "string")) {
      return next(new ErrorHandler("Please provide product images", 400));
    }
    const own = new Map(product.images.map((image) => [image.public_id, image]));
    const plan = [];
    for (const token of order) {
      if (token.startsWith("e:") && own.has(token.slice(2))) plan.push({ keep: own.get(token.slice(2)) });
      else if (/^n:\d+$/.test(token) && Number(token.slice(2)) < incoming.length) plan.push({ index: Number(token.slice(2)) });
      else return next(new ErrorHandler("Invalid product image selection", 400));
    }
    try {
      const final = [];
      for (const step of plan) {
        final.push(step.keep ? (step.keep.toObject ? step.keep.toObject() : step.keep) : await uploadImage(incoming[step.index], uploaded));
      }
      update.images = final;
    } catch (error) {
      await destroyImages(uploaded); // nothing was saved yet: remove what this request uploaded
      throw error;
    }
    const keptIds = new Set(plan.filter((step) => step.keep).map((step) => step.keep.public_id));
    removed = product.images.filter((image) => !keptIds.has(image.public_id));
  } else {
    // Legacy behaviour: `images` without `order` replaces every image; no `images` leaves them untouched.
    const images = req.body.images === undefined ? undefined : asList(req.body.images);
    if (images !== undefined) {
      if (!images.length || images.some((image) => typeof image !== "string")) {
        return next(new ErrorHandler("Please provide product images", 400));
      }
      try {
        const links = [];
        for (const data of images) await uploadImage(data, links);
        update.images = links;
      } catch (error) {
        await destroyImages(uploaded);
        throw error;
      }
      removed = product.images;
    }
  }

  try {
    product = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  } catch (error) {
    await destroyImages(uploaded); // keep the old images referenced; drop this request's uploads
    throw error;
  }

  // Only after the database points at the new list are the removed files deleted.
  const cleanupFailed = removed.length ? await destroyImages(removed) : 0;
  res.status(200).json({ success: true, product, cleanupFailed });
});

// Delete the product => /api/v1/admin/product/:id

exports.deleteProduct = catchAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("product not exist", 404));
  }
  // Deleting images assosiated with the product
  for (let i = 0; i < product.images.length; i++) {
    if (product.images[i].provider !== "external") {
      await cloudinary.v2.uploader.destroy(product.images[i].public_id);
    }
  }
  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: "Product is deleted",
  });
});
