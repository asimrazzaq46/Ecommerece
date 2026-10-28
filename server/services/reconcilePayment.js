const completeOrder = require("./completeOrder");
const Checkout = require("../models/checkout");
const Orders = require("../models/order");
const stripe = require("../utils/stripeClient");
const ErrorHandler = require("../utils/errorHandler");
module.exports = async (paymentId, userId) => {
  if (typeof paymentId !== "string" || !/^pi_[A-Za-z0-9_]+$/.test(paymentId))
    throw new ErrorHandler("Invalid payment reference", 400);
  const existing = await Checkout.findOne({
    paymentIntentId: paymentId,
    user: userId,
  });
  if (!existing) return completeOrder(paymentId, userId);
  let refund = existing.refundPending;
  if (!refund) {
    try {
      return await completeOrder(paymentId, userId);
    } catch (error) {
      if (error.code !== "STOCK_UNAVAILABLE") throw error;
      refund = true;
    }
  }
  // This write conflicts with concurrent order transactions: only one path can win.
  const checkout = await Checkout.findOneAndUpdate(
    { _id: existing._id, completed: false },
    { $set: { refundPending: true }, $min: { refundRequestedAt: new Date() } },
    { new: true },
  );
  if (!checkout) return Orders.findById(existing._id);
  if (!checkout.refundId) {
    if (
      checkout.refundRequestedAt &&
      Date.now() - new Date(checkout.refundRequestedAt).getTime() >
        23 * 60 * 60 * 1000
    )
      throw new ErrorHandler(
        "Refund verification requires support; do not retry payment",
        409,
      );
    const result = await stripe().refunds.create(
      { payment_intent: paymentId },
      { idempotencyKey: "stock-refund-" + existing._id },
    );
    await Checkout.updateOne(
      { _id: existing._id },
      { $set: { refundId: result.id, refundStatus: result.status } },
    );
  }
  const error = new ErrorHandler(
    "Stock became unavailable. A refund has been requested; do not pay again for this checkout.",
    409,
  );
  error.code = "REFUND_REQUESTED";
  throw error;
};
