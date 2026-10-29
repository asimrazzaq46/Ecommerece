// UPDATED: single source for cart/checkout totals (free shipping over $200, else $25; 5% tax).
export const FREE_SHIPPING_FROM = 200;

export function orderTotals(cartItems) {
  const itemsPrice = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingPrice = itemsPrice > FREE_SHIPPING_FROM ? 0 : 25;
  const taxPrice = Number((0.05 * itemsPrice).toFixed(2));
  const totalPrice = (itemsPrice + shippingPrice + taxPrice).toFixed(2);
  return { itemsPrice, shippingPrice, taxPrice, totalPrice };
}
