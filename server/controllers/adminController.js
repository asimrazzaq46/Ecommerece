const { removeAvatar } = require("../utils/avatarStorage");

const ErrorHandler = require("../utils/errorHandler");
const catchAsyncError = require("../middlewares/catchAsyncError");

const User = require("../models/user");
const Product = require("../models/product");
const Orders = require("../models/order");

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
      new ErrorHandler(`User does not found with id: ${req.params.id}`, 404)
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
  // UPDATED: an admin cannot demote themselves, so the last admin can never be removed.
  if (String(req.params.id) === String(req.user._id) && newUserData.role !== "admin") {
    return next(new ErrorHandler("You cannot remove your own admin role", 400));
  }

  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
  });
  if (!user) return next(new ErrorHandler("User not found", 404));

  res.status(200).json({
    success: true,
  });
});

// Delete User  => /api/v1/admin/user/:id

exports.deleteUser = catchAsyncError(async (req, res, next) => {
  // UPDATED: self-deletion would also allow deleting the last admin.
  if (String(req.params.id) === String(req.user._id)) {
    return next(new ErrorHandler("You cannot delete your own account", 400));
  }
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User does not found with id: ${req.params.id}`, 404)
    );
  }
  // UPDATED: an admin must be demoted first, so admin accounts are never removed by accident
  if (user.role === "admin") {
    return next(new ErrorHandler("Remove the admin role before deleting this user", 400));
  }
  //REMOVE AVATAR FROM CLOUDINARY

  await removeAvatar(user.avatar);

  await user.deleteOne();
  await require("../models/cart").deleteOne({ user: user._id }); // UPDATED: no orphaned account cart

  res.status(200).json({
    success: true,
  });
});

//-------------------- ORDERS --------------//

// Get ALL orders => api/v1/admin/orders/

exports.allOrders = catchAsyncError(async (req, res, next) => {
  // UPDATED: customer name/email for the admin dashboard (admin-only route)
  const orders = await Orders.find().populate("user", "name email");
  let totalAmount = 0;

  if (!orders) {
    return next(new ErrorHandler("No Order Found!", 404));
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
        if (result.modifiedCount !== 1) throw new ErrorHandler("Product is missing or stock is insufficient", 409);
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
    return next(new ErrorHandler("No Order Found!", 404));
  }
  await order.deleteOne();
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

// UPDATED: one aggregated response for the admin dashboard => /api/v1/admin/stats
// (replaces downloading every order and user just to count and sum them in the browser)
const LOW_STOCK = 5;
exports.dashboardStats = catchAsyncError(async (req, res) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const [totals, monthly, recent, users, newUsers, products, outOfStock, lowStockCount, lowStock] = await Promise.all([
    Orders.aggregate([{ $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: "$totalPrice" }, processing: { $sum: { $cond: [{ $eq: ["$orderStatus", "Processing"] }, 1, 0] } } } }]),
    Orders.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, revenue: { $sum: "$totalPrice" }, orders: { $sum: 1 } } },
    ]),
    Orders.find().sort({ createdAt: -1 }).limit(5).select("createdAt totalPrice orderStatus orderItems.product orderItems.image orderItems.quantity shippingInfo.city user").populate("user", "name email"),
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: monthStart } }),
    Product.countDocuments(),
    Product.countDocuments({ stock: 0 }),
    Product.countDocuments({ stock: { $gt: 0, $lte: LOW_STOCK } }),
    Product.find({ stock: { $lte: LOW_STOCK } }).sort({ stock: 1 }).limit(6).select("name stock images"),
  ]);
  const t = totals[0] || { orders: 0, revenue: 0, processing: 0 };
  res.status(200).json({
    success: true,
    stats: {
      revenue: t.revenue, orders: t.orders, processing: t.processing, users, newUsers, products, outOfStock, lowStockCount,
      monthly: monthly.map((m) => ({ year: m._id.year, month: m._id.month, revenue: m.revenue, orders: m.orders })),
      recent, lowStock: lowStock.map((p) => ({ _id: p._id, name: p.name, stock: p.stock, image: p.images && p.images[0] ? p.images[0].url : null })),
    },
  });
});
