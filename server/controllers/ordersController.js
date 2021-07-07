const Orders = require("../models/order");
const Product = require("../models/product");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncError = require("../middlewares/catchAsyncError");
const { findById } = require("../models/order");

// create a new order => api/v1/order/new

exports.newOrder = catchAsyncError(async (req, res, next) => {
  const {
    orderItems,
    shippingInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentInfo,
  } = req.body;

  const order = await Orders.create({
    orderItems,
    shippingInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentInfo,
    paidAt: Date.now(),
    user: req.user._id,
  });

  res.status(200).json({
    success: true,
    order,
  });
});

// Get single order - ADMIN => api/v1/order/:id

exports.singleOrder = catchAsyncError(async (req, res, next) => {
  const order = await Orders.findById(req.params.id).populate(
    "users",
    "name email"
  );

  if (!order) {
    return next(new ErrorHandler("No Order Found With This Id"), 404);
  }

  res.status(200).json({
    success: true,
    order,
  });
});

// Get Logged in user orders => api/v1/order/me

exports.myOrders = catchAsyncError(async (req, res, next) => {
  const order = await Orders.find({ user: req.user.id });

  if (!order) {
    return next(new ErrorHandler("No Order Found!"), 404);
  }

  res.status(200).json({
    success: true,
    order,
  });
});
