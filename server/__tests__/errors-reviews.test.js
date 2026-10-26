const errorMiddleware = require("../middlewares/error");
const ErrorHandler = require("../utils/errorHandler");
const Product = require("../models/product");
const { deleteProductReview } = require("../controllers/reviewController");
const { response } = require("./helpers");

test.each(["PRODUCTION", "production", "test"])("error responses terminate requests in %s", env => {
  const old = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = env;
    const res = response();
    errorMiddleware(new ErrorHandler("Not found", 404), {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, Message: "Not found" }));
  } finally { process.env.NODE_ENV = old; }
});

test.each([[5, 3], [5]])("deleting a review recalculates the remaining ratings: %j", async (...ratings) => {
  const reviews = ratings.map((rating, i) => ({ _id: `r${i}`, rating }));
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(Product, "findById").mockResolvedValue({ Reviews: reviews });
  const update = jest.spyOn(Product, "findByIdAndUpdate").mockResolvedValue({});
  const next = jest.fn();
  await deleteProductReview({ query: { productId: "p", id: "r0" }, user: { role: "admin" } }, response(), next);
  expect(next).not.toHaveBeenCalled();
  const remaining = ratings.slice(1);
  expect(update.mock.calls[0][1]).toEqual(expect.objectContaining({
    NumOfReviews: remaining.length,
    rating: remaining.length ? remaining.reduce((sum, rating) => sum + rating, 0) / remaining.length : 0,
  }));
});
