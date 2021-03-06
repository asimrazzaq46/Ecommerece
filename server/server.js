const app = require("./app");
const connectDatabase = require("./config/database");
const cloudinary = require("cloudinary");

const dotenv = require("dotenv");

// Handled Uncaught Exceptions
process.on("uncaughtException", (err) => {
  console.log(`ERROR: ${err.stack}`);
  console.log("Shutting down due to Uncaught Exceptions");
  process.exit(1);
});

// Setting Up config files
dotenv.config({ path: "server/config/config.env" });

// connecting to database
connectDatabase();

// Setting up CLOUDINARY
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const server = app.listen(process.env.PORT, () => {
  console.log(
    `Server Started on Port: ${process.env.PORT} in ${process.env.NODE_ENV} mode.`
  );
});

// Handled Unhandled Promise Rejections
process.on("unhandledRejection", (err) => {
  console.log(`ERROR: ${err.message}`);
  console.log(
    `Shutting down the server due to unhandled promise rejections...`
  );
  server.close(() => {
    process.exit(1);
  });
});
