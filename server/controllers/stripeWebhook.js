const stripe = require("../utils/stripeClient");
const completeOrder = require("../services/reconcilePayment");
module.exports = async (req, res) => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({success:false});
  let event;
  try { event = stripe().webhooks.constructEvent(req.body, req.get("stripe-signature"), process.env.STRIPE_WEBHOOK_SECRET); }
  catch { return res.status(400).json({success:false}); }
  if (event.type !== "payment_intent.succeeded") return res.json({received:true});
  const payment = event.data.object;
  if (!payment.metadata?.checkoutId || !payment.metadata?.userId) return res.json({received:true});
  try { await completeOrder(payment.id, payment.metadata.userId); return res.json({received:true}); }
  catch (error) { if (error.code === "REFUND_REQUESTED") return res.json({received:true}); return res.status(500).json({received:false}); }
};
