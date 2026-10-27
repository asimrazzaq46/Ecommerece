import React, { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useAlert } from "../ui/Alerts";
import {
  useProduct,
  useReviewMutation,
  messageFor,
} from "../../queries/products";
import { addItemToCart } from "../../actions";
import Loader from "../layouts/Loader";
import MetaDAta from "../layouts/MetaDAta";
import ListReviews from "../reviews/ListReviews";
export default function ProductDetails() {
  const { id } = useParams();
  return <ProductDetailContent key={id} id={id} />;
}
function ProductDetailContent({ id }) {
  const query = useProduct(id);
  const review = useReviewMutation(id);
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [imageIndex, setImageIndex] = useState(0);
  const [adding, setAdding] = useState(false);
  const dialog = useRef(null);
  const dispatch = useDispatch();
  const alert = useAlert();
  const user = useSelector((state) => state.auth.user);
  if (query.isPending) return <Loader />;
  if (query.isError)
    return (
      <div role="alert">
        {messageFor(query.error)}{" "}
        <button onClick={() => query.refetch()}>Retry</button>
      </div>
    );
  const product = query.data;
  const images = product.images || [];
  const selectedImage = images[imageIndex % Math.max(1, images.length)];
  const addToCart = async () => {
    setAdding(true);
    try {
      await dispatch(addItemToCart(id, quantity));
      alert.success("Item added to cart");
    } catch (error) {
      alert.error(messageFor(error));
    } finally {
      setAdding(false);
    }
  };
  const submitReview = async (event) => {
    event.preventDefault();
    try {
      await review.mutateAsync({ rating, comment });
      dialog.current.close();
      setComment("");
      alert.success("Review posted successfully");
    } catch (error) {
      alert.error(messageFor(error));
    }
  };
  return (
    <>
      <MetaDAta title={product.name} />
      <div className="row justify-content-around">
        <div className="col-12 col-lg-5 img-fluid" id="product_image">
          {selectedImage && (
            <img
              className="d-block w-100"
              src={selectedImage.url}
              alt={product.name}
            />
          )}
          {images.length > 1 && (
            <div className="d-flex justify-content-between">
              <button
                onClick={() =>
                  setImageIndex((i) => (i + images.length - 1) % images.length)
                }
              >
                Previous image
              </button>
              <button
                onClick={() => setImageIndex((i) => (i + 1) % images.length)}
              >
                Next image
              </button>
            </div>
          )}
        </div>
        <div className="col-12 col-lg-5 mt-5">
          <h3>{product.name}</h3>
          <p id="product_id">Product #{product._id}</p>
          <hr />
          <div
            className="rating-outer"
            aria-label={product.rating + " out of 5 stars"}
          >
            <div
              className="rating-inner"
              style={{ width: (product.rating / 5) * 100 + "%" }}
            />
          </div>
          <span id="no_of_reviews"> ({product.NumOfReviews} Reviews)</span>
          <hr />
          <p id="product_price">${product.price}</p>
          <div className="stockCounter d-inline">
            <button
              className="btn btn-danger minus"
              aria-label="Decrease quantity"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => q - 1)}
            >
              −
            </button>
            <input
              aria-label="Quantity"
              type="number"
              className="form-control count d-inline"
              value={quantity}
              readOnly
            />
            <button
              className="btn btn-primary plus"
              aria-label="Increase quantity"
              disabled={quantity >= product.stock}
              onClick={() => setQuantity((q) => q + 1)}
            >
              +
            </button>
          </div>
          <button
            id="cart_btn"
            className="btn btn-primary ml-4"
            disabled={adding || product.stock < quantity}
            onClick={addToCart}
          >
            {adding ? "Adding…" : "Add to Cart"}
          </button>
          <hr />
          <p>
            Status:{" "}
            <span
              id="stock_status"
              className={product.stock > 0 ? "greenColor" : "redColor"}
            >
              {product.stock > 0 ? "In Stock" : "Out of Stock"}
            </span>
          </p>
          <hr />
          <h4>Description</h4>
          <p>{product.description}</p>
          <p>
            Sold by: <strong>{product.seller}</strong>
          </p>
          {user ? (
            <button
              id="review_btn"
              className="btn btn-primary mt-4"
              onClick={() => dialog.current.showModal()}
            >
              Submit Your Review
            </button>
          ) : (
            <p className="alert alert-info">Login first to post your review.</p>
          )}
        </div>
      </div>
      <dialog
        ref={dialog}
        aria-labelledby="review-title"
        style={{
          border: "1px solid #ccc",
          borderRadius: 8,
          width: "min(500px, 90vw)",
        }}
      >
        <form onSubmit={submitReview}>
          <h2 id="review-title">Your review</h2>
          <label htmlFor="rating">Rating</label>
          <select
            id="rating"
            className="form-control"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} stars
              </option>
            ))}
          </select>
          <label className="mt-3" htmlFor="review">
            Comment
          </label>
          <textarea
            id="review"
            className="form-control"
            required
            maxLength={2000}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {review.isError && <p role="alert">{messageFor(review.error)}</p>}
          <button className="btn btn-primary mt-3" disabled={review.isPending}>
            {review.isPending ? "Saving…" : "Submit"}
          </button>
          <button
            type="button"
            className="btn btn-secondary mt-3 ml-2"
            disabled={review.isPending}
            onClick={() => dialog.current.close()}
          >
            Cancel
          </button>
        </form>
      </dialog>
      {!!product.Reviews?.length && <ListReviews reviews={product.Reviews} />}
    </>
  );
}
