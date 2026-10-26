const mongoose = require("mongoose");

module.exports = mongoose.model("Checkout", new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Users" },
  requestHash: { type: String, required: true },
  // Only the validated, server-priced snapshot is stored here.
  quote: { type: mongoose.Schema.Types.Mixed, required: true },
  paymentIntentId: String,
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}));
