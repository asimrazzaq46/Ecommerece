const crypto = require("crypto");
const cloudinary = require("cloudinary");

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
  //REMOVE AVATAR FROM CLOUDINARY

  const image_id = user.avatar.public_id;
  await cloudinary.v2.uploader.destroy(image_id);

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

exports.updateOrder = catchAsyncError(async (req, res) => {
  const { inTransaction } = require("../utils/transaction");
  const status = req.body.status;
  if (!["Processing", "Shipped", "Delivered"].includes(status)) throw new ErrorHandler("Invalid order status", 400);
  await inTransaction(async session => {
    const order = await Orders.findById(req.params.id).session(session);
    if (!order) throw new ErrorHandler("Order not found", 404);
    if (order.orderStatus === status) return;
    const transitions = { Processing: ["Shipped", "Delivered"], Shipped: ["Delivered"], Delivered: [] };
    if (!transitions[order.orderStatus] || !transitions[order.orderStatus].includes(status)) {
      throw new ErrorHandler("Invalid order status transition", 400);
    }
    if (!order.paymentInfo || order.paymentInfo.status !== "succeeded") throw new ErrorHandler("Order is not paid", 400);
    // Legacy shipped orders already had stock deducted by the previous implementation.
    if (!order.stockDeducted && order.orderStatus === "Processing") {
      for (const item of order.orderItems) {
        if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) throw new ErrorHandler("Invalid order quantity", 400);
        const result = await Product.updateOne({ _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } }, { session });
        if (result.nModified !== 1) throw new ErrorHandler("Product is missing or stock is insufficient", 409);
      }
    }
    order.stockDeducted = true;
    order.orderStatus = status;
    if (status === "Delivered") order.deliveredAt = Date.now();
    await order.save({ session });
  });
  res.status(200).json({ success: true });
});

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

// get all products (ADMINS) from the database => /api/v1/admin/products

exports.getAdminProducts = catchAsyncError(async (req, res, next) => {
  const products = await Product.find();

  res.status(200).json({
    success: true,
    products,
  });
});
