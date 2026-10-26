const Product = require("../models/product");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncError = require("../middlewares/catchAsyncError");

// Create new Review => /api/v1/review

exports.createProductReview = catchAsyncError(async (req, res, next) => {
  const { rating, comment, productId } = req.body;
  if (!["number", "string"].includes(typeof rating) || !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5 || typeof comment !== "string" || !comment.trim() || comment.length > 2000 || typeof productId !== "string" || !productId) {
    return next(new ErrorHandler("Provide a product, a rating from 1 to 5 and a comment (max 2000 characters)", 400));
  }

  const review = {
    user: req.user.id,
    name: req.user.name,
    rating: Number(rating),
    comment: comment.trim(),
  };

  const product = await Product.findById(productId);

  if (!product) return next(new ErrorHandler("Product not found", 404));

  const isReviewed = product.Reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );

  if (isReviewed) {
    product.Reviews.forEach((review) => {
      if (review.user.toString() === req.user._id.toString()) {
        review.comment = comment.trim();
        review.rating = Number(rating);
      }
    });
  } else {
    product.Reviews.push(review);
    product.NumOfReviews = product.Reviews.length;
  }

  product.rating =
    product.Reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.Reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

// Get all Reviews => /api/v1/reviews

exports.getProductReview = catchAsyncError(async (req, res, next) => {
  if (typeof req.query.id !== "string" || !req.query.id) return next(new ErrorHandler("Product id is required", 400));
  const product = await Product.findById(req.query.id);
  if (!product) return next(new ErrorHandler("Product not found", 404));

  res.status(200).json({
    success: true,
    reviews: product.Reviews,
  });
});

// Delete Product Review => /api/v1/reviews

exports.deleteProductReview = catchAsyncError(async (req, res, next) => {
  if (typeof req.query.id !== "string" || !req.query.id || typeof req.query.productId !== "string" || !req.query.productId) return next(new ErrorHandler("Product and review ids are required", 400));
  const product = await Product.findById(req.query.productId);
  if (!product) return next(new ErrorHandler("Product not found", 404));
  const reviews = product.Reviews.filter(
    (review) => review._id.toString() !== req.query.id.toString()
  );

  const NumOfReviews = reviews.length;

  const rating = reviews.length
    ? reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length
    : 0;

  await Product.findByIdAndUpdate(
    req.query.productId,
    {
      Reviews: reviews,
      rating,
      NumOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
    product,
  });
});
