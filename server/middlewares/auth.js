const jwt = require("jsonwebtoken");

const User = require("../models/user");
const catchAsyncError = require("./catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

// checks if user is authenticated or not
exports.isAuthenticatedUser = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return next(new ErrorHandler("Login First to access this resoucrce", 401));
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id); // decoded.id => id is the payload we saved in the jwt_token modals/user line 91

  next();
});

// Handling User Roles
exports.authorizeRole = (...roles) => (req, res, next) => {
  // role is saved in user models by default it is user,,product routes we hard coded as an "admin"
  if (!roles.includes(req.user.role)) {
    return next(
      new ErrorHandler(
        `Role (${req.user.role}) is not allowed to access this resource`,
        403
      )
    );
  }
  next();
};
