const express = require("express");
const cookieParser = require("cookie-parser");
const bodyparser = require("body-parser");
const fileupload = require("express-fileupload");

const errorMiddleware = require("./middlewares/error");

const app = express();

app.use(express.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(fileupload());

// import all routes
const products = require("./routes/products");
const auth = require("./routes/auth");
const admin = require("./routes/admin");
const order = require("./routes/order");
const review = require("./routes/review");

app.use("/api/v1", products);
app.use("/api/v1", auth);
app.use("/api/v1", admin);
app.use("/api/v1", order);
app.use("/api/v1", review);

// Error handling with middlwares
app.use(errorMiddleware);

module.exports = app;
