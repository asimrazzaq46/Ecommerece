import React, { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useAlert } from "../ui/Alerts";
import {
  useProduct,
  useProducts,
  useReviewMutation,
  messageFor,
} from "../../queries/products";
import { addItemToCart } from "../../actions";
import { formatPrice } from "../../i18n";
import Loader from "../layouts/Loader";
import MetaDAta from "../layouts/MetaDAta";
import ListReviews from "../reviews/ListReviews";
import Stars from "../ui/Stars";
import ProductCard from "./products";
import "./Catalog.css";
import "./ProductDetails.css";

export default function ProductDetails() {
  const { id } = useParams();
  return <ProductDetailContent key={id} id={id} />;
}

// UPDATED: up to 4 real products from the same category, excluding the current one.
function RelatedProducts({ product }) {
  const { t } = useTranslation();
  const query = useProducts({ category: product.catagory });
  const related = (query.data?.products || []).filter((p) => p._id !== product._id).slice(0, 4);
  if (!related.length) return null;
  return (
    <section className="vx-related">
      <span className="vx-eyebrow">{t("product.related.eyebrow")}</span>
      <h2 className="vx-title-xl">{t("product.related.title", { category: t(`categories.${product.catagory}`, product.catagory) })}</h2>
      <div className="vx-related-grid">
        {related.map((item) => (
          <ProductCard key={item._id} product={item} />
        ))}
      </div>
    </section>
  );
}

function ProductDetailContent({ id }) {
  const query = useProduct(id);
  const review = useReviewMutation(id);
  const { t } = useTranslation();
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
      <div className="vx-page">
        <div className="vx-container vx-pd">
          <div className="vx-card vx-state" role="alert">
            <span className="vx-state-icon"><i className="fa fa-exclamation-triangle" aria-hidden="true" /></span>
            <h1 className="vx-title-md">{t("product.loadError")}</h1>
            <p>{messageFor(query.error)}</p>
            <button className="vx-btn vx-btn--primary" onClick={() => query.refetch()}>
              {t("product.retry")}
            </button>
          </div>
        </div>
      </div>
    );
  const product = query.data;
  const images = product.images || [];
  const selectedImage = images[imageIndex % Math.max(1, images.length)];
  const inStock = product.stock > 0;
  const categoryLabel = t(`categories.${product.catagory}`, product.catagory);
  const addToCart = async () => {
    setAdding(true);
    try {
      await dispatch(addItemToCart(id, quantity));
      alert.success(t("product.added"));
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
      alert.success(t("product.reviews.posted"));
    } catch (error) {
      alert.error(messageFor(error));
    }
  };
  return (
    <>
      <MetaDAta title={product.name} />
      {/* UPDATED: Veyra product page (Stitch product details design) */}
      <div className="vx-page">
        <div className="vx-container vx-pd">
          <nav className="vx-breadcrumb vx-pd-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">{t("nav.home")}</Link>
            <span aria-hidden="true">/</span>
            {product.catagory && (
              <>
                <Link to={`/?category=${encodeURIComponent(product.catagory)}`}>{categoryLabel}</Link>
                <span aria-hidden="true">/</span>
              </>
            )}
            <span>{product.name}</span>
          </nav>

          <div className="vx-pd-grid">
            <div className="vx-pd-gallery">
              <div className="vx-pd-main-image">
                {selectedImage && <img src={selectedImage.url} alt={product.name} />}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="vx-pd-nav is-prev"
                      aria-label={t("product.prevImage")}
                      onClick={() => setImageIndex((i) => (i + images.length - 1) % images.length)}
                    >
                      <i className="fa fa-angle-left" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="vx-pd-nav is-next"
                      aria-label={t("product.nextImage")}
                      onClick={() => setImageIndex((i) => (i + 1) % images.length)}
                    >
                      <i className="fa fa-angle-right" aria-hidden="true" />
                    </button>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="vx-pd-thumbs">
                  {images.map((image, index) => (
                    <button
                      key={image.public_id || image.url}
                      type="button"
                      className={`vx-pd-thumb${index === imageIndex % images.length ? " is-active" : ""}`}
                      aria-label={t("product.showImage", { n: index + 1 })}
                      aria-pressed={index === imageIndex % images.length}
                      onClick={() => setImageIndex(index)}
                    >
                      <img src={image.url} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="vx-pd-info">
              <div>
                <span className="vx-pd-tag">{categoryLabel}</span>
                <h1 className="vx-title-xl vx-pd-title">{product.name}</h1>
                <div className="vx-pd-rating">
                  <Stars value={product.rating} />
                  <strong>{Number(product.rating || 0).toFixed(1)}</strong>
                  <span aria-hidden="true">•</span>
                  <a href="#reviews">{t("product.reviewsCount", { count: product.NumOfReviews || 0 })}</a>
                </div>
              </div>

              <div className="vx-card vx-pd-price-card">
                <span className="vx-pd-price">{formatPrice(product.price)}</span>
                <p className={`vx-pd-stock${inStock ? "" : " is-out"}`}>
                  <span className="vx-pd-stock-dot" aria-hidden="true" />
                  <strong>{t(inStock ? "product.inStock" : "product.outOfStock")}</strong>
                  {inStock && product.stock <= 5 && <span className="vx-pd-low">{t("product.onlyLeft", { count: product.stock })}</span>}
                </p>
              </div>

              <div className="vx-pd-buy">
                <div className="vx-stepper">
                  <button
                    type="button"
                    aria-label={t("product.decrease")}
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => q - 1)}
                  >
                    <i className="fa fa-minus" aria-hidden="true" />
                  </button>
                  <input aria-label={t("product.quantity")} type="number" value={quantity} readOnly />
                  <button
                    type="button"
                    aria-label={t("product.increase")}
                    disabled={quantity >= product.stock}
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    <i className="fa fa-plus" aria-hidden="true" />
                  </button>
                </div>
                <button
                  type="button"
                  className="vx-btn vx-btn--primary vx-btn--caps vx-pd-add"
                  disabled={adding || product.stock < quantity}
                  onClick={addToCart}
                >
                  <i className="fa fa-shopping-bag" aria-hidden="true" />
                  {adding ? t("product.adding") : `${t("product.addToCart")} • ${formatPrice(product.price * quantity)}`}
                </button>
              </div>

              <div className="vx-pd-accordion">
                <details className="vx-card" open>
                  <summary className="vx-title-sm">{t("product.description")}</summary>
                  <p className="vx-pd-desc">{product.description}</p>
                </details>
                <details className="vx-card">
                  <summary className="vx-title-sm">{t("product.details")}</summary>
                  <dl className="vx-pd-specs">
                    <dt>{t("product.category")}</dt>
                    <dd>{categoryLabel}</dd>
                    <dt>{t("product.seller")}</dt>
                    <dd>{product.seller}</dd>
                    <dt>{t("product.productId")}</dt>
                    <dd>{product._id}</dd>
                  </dl>
                </details>
              </div>
            </div>
          </div>

          <ListReviews
            reviews={product.Reviews || []}
            rating={product.rating}
            action={
              user ? (
                <button type="button" className="vx-btn vx-btn--soft vx-btn--caps vx-review-write" onClick={() => dialog.current.showModal()}>
                  <i className="fa fa-pencil" aria-hidden="true" /> {t("product.reviews.write")}
                </button>
              ) : (
                <Link to={`/login?redirect=${encodeURIComponent(`/product/${id}`)}`} className="vx-btn vx-btn--soft vx-btn--caps vx-review-write">
                  {t("product.reviews.loginToReview")}
                </Link>
              )
            }
          />

          <RelatedProducts product={product} />
        </div>
      </div>

      <dialog ref={dialog} aria-labelledby="review-title" className="vx-dialog">
        <form onSubmit={submitReview}>
          <div className="vx-dialog-head">
            <div>
              <h2 id="review-title" className="vx-title-sm">{t("product.reviews.dialogTitle")}</h2>
              <p className="vx-muted">{t("product.reviews.dialogText")}</p>
            </div>
            <button
              type="button"
              className="vx-icon-btn"
              aria-label={t("product.reviews.close")}
              disabled={review.isPending}
              onClick={() => dialog.current.close()}
            >
              <i className="fa fa-times" aria-hidden="true" />
            </button>
          </div>
          <fieldset className="vx-star-input">
            <legend>{t("product.reviews.rating")}</legend>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} title={t("product.reviews.stars", { count: n })}>
                <input
                  type="radio"
                  name="rating"
                  value={n}
                  checked={rating === n}
                  onChange={() => setRating(n)}
                  aria-label={t("product.reviews.stars", { count: n })}
                />
                <i className={`fa ${n <= rating ? "fa-star" : "fa-star-o"}`} aria-hidden="true" />
              </label>
            ))}
          </fieldset>
          <label className="vx-dialog-label" htmlFor="review">
            {t("product.reviews.comment")}
          </label>
          <textarea
            id="review"
            className="vx-textarea"
            required
            rows={4}
            maxLength={2000}
            placeholder={t("product.reviews.commentPlaceholder")}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {review.isError && <p role="alert" className="vx-filter-error">{messageFor(review.error)}</p>}
          <div className="vx-dialog-actions">
            <button
              type="button"
              className="vx-btn vx-btn--soft"
              disabled={review.isPending}
              onClick={() => dialog.current.close()}
            >
              {t("product.reviews.cancel")}
            </button>
            <button className="vx-btn vx-btn--primary vx-btn--caps" disabled={review.isPending}>
              {review.isPending ? t("product.reviews.saving") : t("product.reviews.submit")}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
