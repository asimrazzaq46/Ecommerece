// UPDATED: account cart and saved shipping address routes (all require a logged-in user)
const express = require("express");
const router = express.Router();
const { isAuthenticatedUser } = require("../middlewares/auth");
const cart = require("../controllers/cartController");

router
  .route("/cart")
  .get(isAuthenticatedUser, cart.getCart)
  .delete(isAuthenticatedUser, cart.clearCart);
router.route("/cart/items").put(isAuthenticatedUser, cart.setCartItem);
router
  .route("/cart/items/:productId")
  .delete(isAuthenticatedUser, cart.removeCartItem);
router.route("/cart/merge").post(isAuthenticatedUser, cart.mergeCart);
router
  .route("/me/shipping")
  .get(isAuthenticatedUser, cart.getShippingInfo)
  .put(isAuthenticatedUser, cart.saveShippingInfo)
  .delete(isAuthenticatedUser, cart.deleteShippingInfo);

module.exports = router;
