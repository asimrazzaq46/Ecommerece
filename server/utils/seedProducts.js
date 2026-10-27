const crypto = require("crypto");
const mongoose = require("mongoose");
const Product = require("../models/product");
const User = require("../models/user");
const catalog = require("../data/product.json");

async function seedProducts({ userId, dryRun = false } = {}) {
  let owner;
  if (userId) {
    if (!/^[a-f\d]{24}$/i.test(userId))
      throw new Error("SEED_USER_ID must be a valid user id");
    owner = await User.findOne({ _id: userId, role: "admin" });
  } else {
    // Use the oldest admin unless an explicit seed owner is supplied.
    owner = await User.findOne({ role: "admin" })
      .sort({ _id: 1 })
      .select("_id");
  }
  if (!owner) throw new Error("Seed owner must be an existing admin");

  const ids = new Set();
  const documents = catalog.map(({ seedKey, ...data }) => {
    if (!seedKey || ids.has(seedKey))
      throw new Error("Seed keys must be unique and nonempty");
    ids.add(seedKey);
    const _id = new mongoose.Types.ObjectId(
      crypto
        .createHash("sha256")
        .update(`shopit-demo-v1:${seedKey}`)
        .digest("hex")
        .slice(0, 24),
    );
    const document = new Product({ ...data, _id, user: owner._id });
    const error = document.validateSync();
    if (error) throw error;
    return document.toObject();
  });
  if (dryRun) return { validated: documents.length, inserted: 0, dryRun: true };
  // Stable IDs and insert-only updates preserve stock, reviews and administrator edits on reruns.
  const result = await Product.bulkWrite(
    documents.map((document) => ({
      updateOne: {
        filter: { _id: document._id },
        update: { $setOnInsert: document },
        upsert: true,
      },
    })),
  );
  return {
    validated: documents.length,
    inserted: result.upsertedCount,
    existing: documents.length - result.upsertedCount,
  };
}

module.exports = seedProducts;
