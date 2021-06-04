const crypto = require("crypto");

const ErrorHandler = require("../utils/errorHandler");
const catchAsyncError = require("../middlewares/catchAsyncError");

const sendToken = require("../utils/jwtToken");
const error = require("../middlewares/error");

const User = require("../models/user");
const Product = require("../models/product");
const Orders = require("../models/order");
const order = require("../models/order");

// Get All user => /api/v1/admin/users

exports.allUser = catchAsyncError(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    users,
  });
});

// Get User Detail => /api/v1/admin/user/:id

exports.getUserDetails = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User does not found with id: ${req.params.id}`),
      404
    );
  }
  res.status(200).json({
    success: true,
    user,
  });
});

// update user profile => /api/v1/admin/user/:id

exports.updateUser = catchAsyncError(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };
  // update Avatare: TODO

  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

// Delete User  => /api/v1/admin/user/:id

exports.deleteUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User does not found with id: ${req.params.id}`),
      404
    );
  }

  await user.remove();

  res.status(200).json({
    success: true,
  });
});

//-------------------- ORDERS --------------//

// Get ALL orders => api/v1/admin/orders/

exports.allOrders = catchAsyncError(async (req, res, next) => {
  const orders = await Orders.find();
  let totalAmount = 0;

  if (!orders) {
    return next(new ErrorHandler("No Order Found!"), 404);
  }

  orders.forEach((order) => {
    totalAmount += order.totalPrice;
  });

  res.status(200).json({
    success: true,
    totalAmount,
    orders,
  });
});

// Update / Process orders => api/v1/admin/order/:id

exports.updateOrder = catchAsyncError(async (req, res, next) => {
  const order = await Orders.findById(req.params.id);

  if (order.orderStatus === "Delivered") {
    return next(new ErrorHandler("You have already ordered this Product"), 400);
  }

  order.orderItems.forEach(async (item) => {
    await updateStock(item.product, item.quantity);
  });

  order.orderStatus = req.body.status;
  order.deliveredAt = Date.now();
  await order.save();

  res.status(200).json({
    success: true,
  });
});

async function updateStock(id, quantity) {
  const product = await Product.findById(id);

  product.stock = product.stock - quantity;
  await product.save();
}

// Delete order => api/v1/admin/order/:id

exports.deleteOrder = catchAsyncError(async (req, res, next) => {
  const order = await Orders.findById(req.params.id);
  let totalAmount = 0;

  if (!order) {
    return next(new ErrorHandler("No Order Found!"), 404);
  }
  await order.remove();
  res.status(200).json({
    success: true,
  });
});
