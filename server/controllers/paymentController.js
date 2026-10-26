const Checkout = require("../models/checkout");
const catchAsyncError = require("../middlewares/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const stripe = require("../utils/stripeClient");
const { validateCheckout, priceCheckout, fingerprint } = require("../utils/checkout");
const { requireTransactions } = require("../utils/transaction");

exports.processPayment = catchAsyncError(async (req, res) => {
  const body = req.body || {};
  if (typeof body.checkoutKey !== "string" || !/^[a-zA-Z0-9-]{16,80}$/.test(body.checkoutKey)) {
    throw new ErrorHandler("Invalid checkout session. Please return to your cart", 400);
  }
  const request = validateCheckout(body);
  await requireTransactions();
  const userId = String(req.user._id);
  const checkoutId = fingerprint([userId, body.checkoutKey]).slice(0, 24);
  const requestHash = fingerprint(request);
  let checkout = await Checkout.findById(checkoutId);
  if (!checkout) {
    const quote = await priceCheckout(request);
    try {
      checkout = await Checkout.findOneAndUpdate({ _id: checkoutId }, {
        $setOnInsert: { user: userId, requestHash, quote, createdAt: new Date() },
      }, { upsert: true, new: true, setDefaultsOnInsert: true, useFindAndModify: false });
    } catch (err) {
      if (err.code !== 11000) throw err;
      checkout = await Checkout.findById(checkoutId);
    }
  }
  if (!checkout || checkout.requestHash !== requestHash || String(checkout.user) !== userId) {
    throw new ErrorHandler("Cart changed. Please start a new checkout", 409);
  }
  let payment;
  if (checkout.paymentIntentId) {
    payment = await stripe().paymentIntents.retrieve(checkout.paymentIntentId);
  } else {
    // Stripe may discard idempotency keys after 24 hours; never reuse an uncertain old attempt.
    if (Date.now() - new Date(checkout.createdAt).getTime() > 23 * 60 * 60 * 1000) {
      throw new ErrorHandler("Checkout expired. Contact support if you already paid", 409);
    }
    payment = await stripe().paymentIntents.create({
      amount: Math.round(checkout.quote.totalPrice * 100), currency: "usd",
      metadata: { userId, checkoutId },
    }, { idempotencyKey: `checkout-${checkoutId}` });
    checkout.paymentIntentId = payment.id;
    await checkout.save();
  }
  res.status(200).json({ success: true, client_secret: payment.client_secret, paymentIntentId: payment.id,
    status: payment.status, totalPrice: checkout.quote.totalPrice });
});

exports.sendStripeApi = catchAsyncError(async (req, res) => {
  if (!process.env.STRIPE_API_KEY) throw new ErrorHandler("Payments are not configured", 503);
  res.status(200).json({ stripeApiKey: process.env.STRIPE_API_KEY });
});
