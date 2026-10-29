const Checkout = require("../models/checkout");
const Orders = require("../models/order");
const Product = require("../models/product");
const Cart = require("../models/cart");
const stripe = require("../utils/stripeClient");
const ErrorHandler = require("../utils/errorHandler");
const { inTransaction } = require("../utils/transaction");

module.exports = async (paymentId, userId) => {
  if (typeof paymentId !== "string" || !/^pi_[A-Za-z0-9_]+$/.test(paymentId))
    throw new ErrorHandler("Invalid payment reference", 400);
  const payment = await stripe().paymentIntents.retrieve(paymentId);
  if (
    payment.status !== "succeeded" ||
    payment.currency !== "usd" ||
    !payment.metadata ||
    payment.metadata.userId !== String(userId)
  ) {
    throw new ErrorHandler(
      "Payment has not been verified for this account",
      400,
    );
  }
  const checkoutId = payment.metadata.checkoutId;
  if (!/^[a-f\d]{24}$/i.test(checkoutId || ""))
    throw new ErrorHandler("Invalid checkout reference", 400);
  return inTransaction(async (session) => {
    const checkout = await Checkout.findById(checkoutId).session(session);
    if (
      !checkout ||
      String(checkout.user) !== String(userId) ||
      checkout.paymentIntentId !== payment.id ||
      Math.round(checkout.quote.totalPrice * 100) !== payment.amount ||
      payment.amount_received !== payment.amount
    ) {
      throw new ErrorHandler("Payment does not match this checkout", 400);
    }
    const existing = await Orders.findById(checkoutId).session(session);
    if (existing) return existing;
    if (checkout.refundPending)
      throw new ErrorHandler(
        "This payment is being refunded because the order could not be fulfilled",
        409,
      );
    if (checkout.completed)
      throw new ErrorHandler("This payment already completed an order", 409);
    for (const item of checkout.quote.orderItems) {
      const result = await Product.updateOne(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { session },
      );
      if (result.modifiedCount !== 1) {
        const error = new ErrorHandler(
          "Payment received, but stock is unavailable. Refund reconciliation is required; do not pay again",
          409,
        );
        error.code = "STOCK_UNAVAILABLE";
        throw error;
      }
    }
    const [order] = await Orders.create(
      [
        {
          ...checkout.quote,
          _id: checkout._id,
          user: userId,
          paymentInfo: { id: payment.id, status: payment.status },
          paidAt: Date.now(),
          stockDeducted: true,
        },
      ],
      { session },
    );
    // UPDATED: same transaction as the order, and skipped on retries (existing order returns above)
    await Cart.deductPurchased(userId, checkout.quote.orderItems, session);
    checkout.completed = true;
    await checkout.save({ session });
    return order;
  });
};
