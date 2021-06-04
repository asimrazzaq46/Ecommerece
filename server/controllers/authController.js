const crypto = require("crypto");
const cloudinary = require("cloudinary");

const User = require("../models/user");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncError = require("../middlewares/catchAsyncError");
const { json } = require("body-parser");

const sendToken = require("../utils/jwtToken");
const error = require("../middlewares/error");
const sendEmail = require("../utils/sendEmail");

// Register User => api/v1/register

exports.registerUser = catchAsyncError(async (req, res, next) => {
  const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
    folder: "avatars",
    width: 150,
    crop: "scale",
  });
  const { name, email, password } = req.body;
  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: result.public_id,
      url: result.secure_url,
    },
  });

  sendToken(user, 200, res);
});

// LOGIN USER => api/v1/login

exports.loginUser = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  //   checks if email and password entered by user is exists in database
  if (!email || !password) {
    return next(new ErrorHandler("Please enter email and password"), 400);
  }

  //   finding user in data base
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid email and Password", 401));
  }

  //   checks if Password is correct or not
  const passwordIsMatched = await user.comparePassword(password);

  if (!passwordIsMatched) {
    return next(new ErrorHandler("Invalid password and email"), 401);
  }

  sendToken(user, 200, res);
});

// Forgot Password => api/v1/password/forgot
exports.forgotPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
  // find the person by email provide by user
  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorHandler("user not found with this email", 404));
  }

  // Get Reset Token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // create Reset Password Url
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/password/reset/${resetToken}`;

  const message = `Your Password Reset token is as follows:\n\n${resetURL}\n\nIf you did not requested this email than, ignore it.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "SHOPIT Password Recovery Email",
      message,
    });

    res.status(200).json({
      success: true,
      message: `email sent to ${user.email}`,
    });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});

// Reset Password => api/v1/password/reset
exports.resetPassword = catchAsyncError(async (req, res, next) => {
  // let Hash the token in the req.prams.token and compare with "resetPasswordToken" in the database of user

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler(
        "The Password token is invalid or has been expired.",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("The Password doesnot match.", 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  sendToken(user, 200, res);
});

// Get currentl logged in user details => api/v1/me

exports.getUserDetails = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  sendToken(user, 200, res);
});

// Update and changed the password of currently logged in user => api/v1/password/update

exports.updatePassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  // check previous password of the user
  const isMatched = await user.comparePassword(req.body.oldPassword);

  if (!isMatched) {
    return next(new ErrorHandler("Old password is incorrect"), 400);
  }

  user.password = req.body.password;
  await user.save();

  sendToken(user, 200, res);
});

// Update user profile => api/v1/me/update

exports.updateProfile = catchAsyncError(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };
  // update Avatare: TODO

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

// logout the use => api/v1/logout

exports.logoutUser = catchAsyncError(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({ status: true, message: "Log Out Successfully" });
});
