// UPDATED: account cart + saved shipping address. Identity always comes from req.user (auth middleware).
const Cart = require("../models/cart");
const Product = require("../models/product");
const User = require("../models/user");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncError = require("../middlewares/catchAsyncError");
const { inTransaction } = require("../utils/transaction");
const { validateShippingInfo } = require("../utils/checkout");

const MAX_ITEMS = 50;
const MAX_QUANTITY = 99;
const isId = (value) =>
  typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
const isQuantity = (value) =>
  Number.isSafeInteger(value) && value >= 1 && value <= MAX_QUANTITY;

// Merges guest items into saved items: same product → quantities added, always capped at stock.
// Unknown or sold-out products are dropped. Pure, so it is unit-tested directly.
exports.mergeCartItems = (saved, incoming, stockById) => {
  const quantities = new Map();
  for (const item of [...saved, ...incoming]) {
    const id = String(item.product).toLowerCase();
    quantities.set(id, (quantities.get(id) || 0) + item.quantity);
  }
  return [...quantities]
    .map(([product, quantity]) => ({
      product,
      quantity: Math.min(quantity, stockById.get(product) || 0, MAX_QUANTITY),
    }))
    .filter((item) => item.quantity > 0)
    .slice(0, MAX_ITEMS);
};

// Shapes the stored cart like the client's Redux cart, with fresh product data.
const cartResponse = async (cart) => {
  const items = (cart && cart.items) || [];
  if (!items.length) return [];
  const products = await Product.find({
    _id: { $in: items.map((item) => item.product) },
  }).select("name price stock images");
  const byId = new Map(
    products.map((product) => [String(product._id), product]),
  );
  return items.flatMap((item) => {
    const product = byId.get(String(item.product));
    if (!product || product.stock < 1 || !product.images[0]) return [];
    return [
      {
        product: String(product._id),
        name: product.name,
        price: product.price,
        image: product.images[0].url,
        stock: product.stock,
        quantity: Math.min(item.quantity, product.stock),
      },
    ];
  });
};

const sendCart = async (res, userId) =>
  res
    .status(200)
    .json({
      success: true,
      cartItems: await cartResponse(await Cart.findOne({ user: userId })),
    });

// GET /api/v1/cart
exports.getCart = catchAsyncError(async (req, res) =>
  sendCart(res, req.user._id),
);

// PUT /api/v1/cart/items  { productId, quantity } → sets the quantity of one product
exports.setCartItem = catchAsyncError(async (req, res, next) => {
  const { productId, quantity } = req.body || {};
  if (!isId(productId) || !isQuantity(quantity))
    return next(new ErrorHandler("Invalid cart item", 400));
  const product = await Product.findById(productId).select("stock");
  if (!product) return next(new ErrorHandler("Product not found", 404));
  if (product.stock < quantity)
    return next(new ErrorHandler("Requested quantity is not available", 409));

  const user = req.user._id;
  const setExisting = () =>
    Cart.updateOne(
      { user, "items.product": productId },
      { $set: { "items.$.quantity": quantity } },
    );
  if (!(await setExisting()).matchedCount) {
    try {
      // Atomic add: only if the product is not there yet and the cart is not full (creates the cart if needed).
      await Cart.updateOne(
        {
          user,
          "items.product": { $ne: productId },
          [`items.${MAX_ITEMS - 1}`]: { $exists: false },
        },
        { $push: { items: { product: productId, quantity } } },
        { upsert: true },
      );
    } catch (error) {
      // Duplicate user key: the cart exists, so a concurrent request added the product or the cart is full.
      if (error.code !== 11000) throw error;
      if (!(await setExisting()).matchedCount)
        return next(new ErrorHandler("Your cart is full", 400));
    }
  }
  await sendCart(res, user);
});

// DELETE /api/v1/cart/items/:productId
exports.removeCartItem = catchAsyncError(async (req, res, next) => {
  if (!isId(req.params.productId))
    return next(new ErrorHandler("Invalid cart item", 400));
  await Cart.updateOne(
    { user: req.user._id },
    { $pull: { items: { product: req.params.productId } } },
  );
  await sendCart(res, req.user._id);
});

// DELETE /api/v1/cart
exports.clearCart = catchAsyncError(async (req, res) => {
  await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } });
  res.status(200).json({ success: true, cartItems: [] });
});

// POST /api/v1/cart/merge  { mergeId, items: [{ product, quantity }] } → idempotent per mergeId
exports.mergeCart = catchAsyncError(async (req, res, next) => {
  const { mergeId, items } = req.body || {};
  if (
    typeof mergeId !== "string" ||
    !/^[A-Za-z0-9_-]{8,64}$/.test(mergeId) ||
    !Array.isArray(items) ||
    items.length > MAX_ITEMS ||
    !items.every(
      (item) => item && isId(item.product) && isQuantity(item.quantity),
    )
  ) {
    return next(new ErrorHandler("Invalid cart item", 400));
  }
  const user = req.user._id;
  const merge = () =>
    inTransaction(async (session) => {
      const cart =
        (await Cart.findOne({ user }).session(session)) ||
        new Cart({ user, items: [] });
      if (cart.mergeIds.includes(mergeId)) return; // retry of an already applied merge
      const ids = [
        ...new Set([
          ...cart.items.map((item) => String(item.product)),
          ...items.map((item) => item.product.toLowerCase()),
        ]),
      ];
      const products = await Product.find({ _id: { $in: ids } })
        .select("stock")
        .session(session);
      cart.items = exports.mergeCartItems(
        cart.items,
        items,
        new Map(products.map((p) => [String(p._id), p.stock])),
      );
      cart.mergeIds = [...cart.mergeIds, mergeId].slice(-20);
      await cart.save({ session });
    });
  try {
    await merge();
  } catch (error) {
    // Two first-time merges can race to create the cart; the loser retries against the saved cart.
    if (error.code !== 11000) throw error;
    await merge();
  }
  await sendCart(res, user);
});

// GET /api/v1/me/shipping
exports.getShippingInfo = catchAsyncError(async (req, res) => {
  res
    .status(200)
    .json({ success: true, shippingInfo: req.user.shippingInfo || null });
});

// PUT /api/v1/me/shipping
exports.saveShippingInfo = catchAsyncError(async (req, res) => {
  const shippingInfo = validateShippingInfo(req.body);
  await User.updateOne({ _id: req.user._id }, { $set: { shippingInfo } });
  res.status(200).json({ success: true, shippingInfo });
});

// DELETE /api/v1/me/shipping
exports.deleteShippingInfo = catchAsyncError(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $unset: { shippingInfo: 1 } });
  res.status(200).json({ success: true, shippingInfo: null });
});
