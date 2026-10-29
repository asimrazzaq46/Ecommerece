const express = require("express");
const cookieParser = require("cookie-parser");
const fileupload = require("express-fileupload");
const dotenv = require("dotenv");

const errorMiddleware = require("./middlewares/error");

const app = express();
// Setting Up config files
dotenv.config({
  path: require("path").resolve(__dirname, "config/config.env"),
  quiet: true,
});
const requestSecurity = require("./middlewares/requestSecurity");
app.use(requestSecurity.headers);
app.post("/api/v1/stripe/webhook", express.raw({type:"application/json",limit:"1mb"}), require("./controllers/stripeWebhook"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api/v1", requestSecurity.origin, requestSecurity.limit);
app.use(
  fileupload({
    limits: { fileSize: 5 * 1024 * 1024, fieldSize: 7 * 1024 * 1024 },
    abortOnLimit: true,
  }),
);
// import all routes
const products = require("./routes/products");
const auth = require("./routes/auth");
const admin = require("./routes/admin");
const order = require("./routes/order");
const review = require("./routes/review");
const payment = require("./routes/payment");
const cart = require("./routes/cart"); // UPDATED: account cart + saved address

app.use("/api/v1", products);
app.use("/api/v1", auth);
app.use("/api/v1", admin);
app.use("/api/v1", order);
app.use("/api/v1", review);
app.use("/api/v1", payment);
app.use("/api/v1", cart);
app.use(require("./routes/seo")); // UPDATED: robots.txt + sitemap.xml

// Error handling with middlwares
app.use(errorMiddleware);

module.exports = app;
