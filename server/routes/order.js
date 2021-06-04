const express = require("express");
const router = express.Router();

const {
  newOrder,
  singleOrder,
  myOrders,
} = require("../controllers/ordersController");

const { isAuthenticatedUser, authorizeRole } = require("../middlewares/auth");

router.route("/order/new").post(isAuthenticatedUser, newOrder);

router.route("/order/me").get(isAuthenticatedUser, myOrders);
router.route("/order/:id").get(isAuthenticatedUser, singleOrder);

module.exports = router;
