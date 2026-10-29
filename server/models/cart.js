const mongoose = require("mongoose");

// UPDATED: account cart. Only product references + quantities are stored;
// name, price, image and stock always come from the Product collection.
const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true, unique: true },
    items: [
      {
        _id: false,
        product: { type: mongoose.Schema.Types.ObjectId, ref: "products", required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    // Recent guest-merge request ids, so a retried merge is applied only once.
    mergeIds: { type: [String], default: [] },
  },
  { timestamps: true },
);

// Removes purchased quantities inside the order transaction; extra units and other items stay.
cartSchema.statics.deductPurchased = async function (userId, orderItems, session) {
  for (const item of orderItems) {
    await this.updateOne(
      { user: userId, "items.product": item.product },
      { $inc: { "items.$.quantity": -item.quantity } },
      { session },
    );
  }
  await this.updateOne({ user: userId }, { $pull: { items: { quantity: { $lte: 0 } } } }, { session });
};

module.exports = mongoose.model("Cart", cartSchema);
