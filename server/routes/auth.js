const express = require("express");

const router = express.Router();

const { isAuthenticatedUser } = require("../middlewares/auth");
const validateAuth = require("../middlewares/validateAuth");

const {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  getUserDetails,
  updatePassword,
  updateProfile,
} = require("../controllers/authController");

// Start Authorization Routes

router.route("/register").post(validateAuth("register"), registerUser);
router.route("/login").post(validateAuth("login"), loginUser);
router.route("/password/forgot").post(validateAuth("forgot"), forgotPassword);

router.route("/password/reset/:token").put(validateAuth("reset"), resetPassword);

router.route("/logout").get(logoutUser);

// End Authorization Routes

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

// Start Profile Routes

router.route("/me").get(isAuthenticatedUser, getUserDetails);

router.route("/password/update").put(isAuthenticatedUser, validateAuth("password"), updatePassword);
router.route("/me/update").put(isAuthenticatedUser, validateAuth("profile"), updateProfile);

// End Profile Routes

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

// Start Admin Routes

// End Profile Routes

module.exports = router;
