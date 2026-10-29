const crypto = require("crypto");
const Product = require("../models/product");
const ErrorHandler = require("./errorHandler");

exports.fingerprint = value => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

exports.validateCheckout = body => {
  if (!Array.isArray(body.orderItems) || !body.orderItems.length || body.orderItems.length > 100) {
    throw new ErrorHandler("Your cart must contain between 1 and 100 products", 400);
  }
  const seen = new Set();
  const orderItems = body.orderItems.map(item => {
    if (!item || typeof item.product !== "string" || !/^[a-f\d]{24}$/i.test(item.product) ||
        !Number.isSafeInteger(item.quantity) || item.quantity < 1 || seen.has(item.product.toLowerCase())) {
      throw new ErrorHandler("Invalid product or quantity in cart", 400);
    }
    seen.add(item.product.toLowerCase());
    return { product: item.product.toLowerCase(), quantity: item.quantity };
  }).sort((a, b) => a.product.localeCompare(b.product));
  return { orderItems, shippingInfo: exports.validateShippingInfo(body.shippingInfo) };
};

// UPDATED: shared by checkout and the saved default address (PUT /me/shipping)
exports.validateShippingInfo = input => {
  const shippingInfo = {};
  for (const key of ["address", "city", "postalCode", "phoneNo", "country"]) {
    const value = input && input[key];
    if (typeof value !== "string" || !value.trim() || value.length > 300) {
      throw new ErrorHandler(`Please provide a valid shipping ${key}`, 400);
    }
    shippingInfo[key] = value.trim();
  }
  return shippingInfo;
};

exports.priceCheckout = async ({ orderItems, shippingInfo }) => {
  const items = [];
  let subtotal = 0;
  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    if (!product || product.stock < item.quantity) throw new ErrorHandler("A product is unavailable or has insufficient stock", 409);
    const price = Math.round(product.price * 100);
    if (!Number.isSafeInteger(price) || price < 0 || !product.images[0]) throw new ErrorHandler("Product is not available for checkout", 409);
    subtotal += price * item.quantity;
    items.push({ product: item.product, quantity: item.quantity, name: product.name, image: product.images[0].url, price: price / 100 });
  }
  const shipping = subtotal > 20000 ? 0 : 2500;
  const tax = Math.round(subtotal * 0.05);
  const amount = subtotal + shipping + tax;
  if (!Number.isSafeInteger(amount) || amount < 50 || amount > 99999999) throw new ErrorHandler("Order total is outside the supported payment range", 400);
  return { orderItems: items, shippingInfo, itemsPrice: subtotal / 100, shippingPrice: shipping / 100, taxPrice: tax / 100, totalPrice: amount / 100 };
};
