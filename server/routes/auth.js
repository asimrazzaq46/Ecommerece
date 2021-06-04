const express = require("express");

const router = express.Router();

const { isAuthenticatedUser } = require("../middlewares/auth");

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

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/password/forgot").post(forgotPassword);

router.route("/password/reset/:token").put(resetPassword); //update data should be "put"

router.route("/logout").get(logoutUser);

// End Authorization Routes

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

// Start Profile Routes

router.route("/me").get(isAuthenticatedUser, getUserDetails);

router.route("/password/update").put(isAuthenticatedUser, updatePassword);
router.route("/me/update").put(isAuthenticatedUser, updateProfile);

// End Profile Routes

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

// Start Admin Routes

// End Profile Routes

module.exports = router;
