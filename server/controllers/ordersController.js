const Orders = require("../models/order");
const Product = require("../models/product");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncError = require("../middlewares/catchAsyncError");
const { findById } = require("../models/order");

// create a new order => api/v1/order/new

exports.newOrder = catchAsyncError(async (req, res) => {
  const completeOrder = require("../services/completeOrder");
  const order = await completeOrder(req.body.paymentInfo && req.body.paymentInfo.id, req.user._id);
  res.status(200).json({ success: true, order });
});

// Get single order - ADMIN => api/v1/order/:id

exports.singleOrder = catchAsyncError(async (req, res, next) => {
  const order = await Orders.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (!order) {
    return next(new ErrorHandler("No Order Found With This Id", 404));
  }

  const ownerId = order.user && (order.user._id || order.user);
  if (req.user.role !== "admin" && (!ownerId || String(ownerId) !== String(req.user._id || req.user.id))) {
    return next(new ErrorHandler("You cannot access this order", 403));
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
