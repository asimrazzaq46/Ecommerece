const ErrorHandler = require("../utils/errorHandler");

module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  const development = String(process.env.NODE_ENV).toLowerCase() === "development";

  if (err.name === "CastError") {
    err = new ErrorHandler(`Resource not found, Invalid: ${err.path}`, 400);
  } else if (err.name === "ValidationError") {
    err = new ErrorHandler(Object.values(err.errors).map(value => value.message).join(", "), 400);
  } else if (err.code === 11000) {
    err = new ErrorHandler("An account or resource with these details already exists", 400);
  } else if (["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(err.name)) {
    err = new ErrorHandler("Invalid or expired session. Please log in again", 401);
  }

  const statusCode = err.statusCode || 500;
  const message = statusCode >= 500 && !development ? "Internal Server Error" : err.message;
  return res.status(statusCode).json({
    success: false,
    Message: message || "Internal Server Error",
    ...(development ? { stack: err.stack } : {}),
  });
};
