const ErrorHandler = require("../utils/errorHandler");

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error!";

  if (process.env.NODE_ENV === "DEVELOPMENT") {
    res.status(err.statusCode).json({
      success: false,
      error: err,
      Message: err.message,
      stack: err.stack,
    });
  }
  if (process.env.NODE_ENV === "PRODUCTION") {
    // Wrong MONGOOSE object ID error

    if (err.name === "CastError") {
      const message = `Resource not found, Invalid: ${err.path}`;

      err = new ErrorHandler(message, 400);
    }

    // Handling MONGOOSE validation error

    if (err.name === "ValidationError") {
      const message = Object.values(err.errors).map((value) => value.message);
      err = new ErrorHandler(message, 400);
    }

    // Handling Mongoose duplicate key Error

    if (err.code === 11000) {
      const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
      err = new ErrorHandler(message, 400);
    }

    // Handling Wrong Jwt Error

    if (err.name === "JsonWebTokenError") {
      const message = `Json Web Token is invalid, Try Again!!!`;
      err = new ErrorHandler(message, 400);
    }

    // Handling Expired Jwt Error

    if (err.name === "TokenExpiredError") {
      const message = `Json Web Token is expired, Try Again!!!`;
      err = new ErrorHandler(message, 400);
    }

    if (err.name === "ValidationError") {
      const message = Object.values(err.errors).map((value) => value.message);
      err = new ErrorHandler(message, 400);
    }

    res.status(err.statusCode).json({
      success: false,
      Message: err.message || "Internal Server Error",
    });
  }
};
