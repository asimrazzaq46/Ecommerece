const express = require("express");

const router = express.Router();

const { isAuthenticatedUser, authorizeRole } = require("../middlewares/auth");

const {
  allUser,
  getUserDetails,
  updateUser,
  deleteUser,
  allOrders,
  updateOrder,
  deleteOrder,
  getAdminProducts,
} = require("../controllers/adminController");

//PRODUCTS
router.route("/admin/products").get(getAdminProducts);

router
  .route("/admin/users")
  .get(isAuthenticatedUser, authorizeRole("admin"), allUser);

router
  .route("/admin/user/:id")
  .get(isAuthenticatedUser, authorizeRole("admin"), getUserDetails)

  .put(isAuthenticatedUser, authorizeRole("admin"), updateUser)

  .delete(isAuthenticatedUser, authorizeRole("admin"), deleteUser);

//------------- ORDERS ------------//

router
  .route("/admin/orders")
  .get(isAuthenticatedUser, authorizeRole("admin"), allOrders);

router
  .route("/admin/order/:id")
  .put(isAuthenticatedUser, authorizeRole("admin"), updateOrder)
  .delete(isAuthenticatedUser, authorizeRole("admin"), deleteOrder);

module.exports = router;
