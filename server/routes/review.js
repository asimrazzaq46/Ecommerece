const express = require("express");

const router = express.Router();
const { isAuthenticatedUser, authorizeRole } = require("../middlewares/auth");

const {
  createProductReview,
  getProductReview,
  deleteProductReview,
} = require("../controllers/reviewController");

router.route("/review").put(isAuthenticatedUser, createProductReview);

router.route("/reviews").get(isAuthenticatedUser, getProductReview);

router.route("/reviews").delete(isAuthenticatedUser, deleteProductReview);

module.exports = router;
