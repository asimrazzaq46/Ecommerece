const Product = require("../models/product");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncError = require("../middlewares/catchAsyncError");
const ApiFeature = require("../utils/apiFeatures");

// create new product => /api/v1/admin/products/new

exports.newProduct = catchAsyncError(async (req, res, next) => {
  // taking the id from user model and assigning to user in product model
  req.body.user = req.user.id;

  const product = await Product.create(req.body);
  res.status(201).json({
    success: true,
    product,
  });
});

// get all products from the database => /api/v1/products

exports.getProducts = catchAsyncError(async (req, res, next) => {
  const resultPerPage = 3;

  const productCount = await Product.countDocuments();

  const apiFeatures = new ApiFeature(Product.find(), req.query)
    .search()
    .filter();

  let products = await apiFeatures.query;

  let filteredProductsCount = products.length;

  apiFeatures.pagination(resultPerPage);

  products = await apiFeatures.query;

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

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    product,
  });
});

// Delete the product => /api/v1/admin/product/:id

exports.deleteProduct = catchAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("product not exist", 404));
  }

  await product.remove();

  res.status(200).json({
    success: true,
    message: "Product is deleted",
  });
});
