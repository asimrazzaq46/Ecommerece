import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useAlert } from "../ui/Alerts";
import Stars from "../ui/Stars";
import { addItemToCart } from "../../actions";
import { messageFor } from "../../queries/products";
import { formatPrice } from "../../i18n";

// UPDATED: Veyra product card (Stitch catalog card) with quick add-to-cart.
const ProductCard = ({ product }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const alert = useAlert();
  const [adding, setAdding] = useState(false);
  const inCart = useSelector(
    (state) => state.cart.cartItems.find((item) => item.product === product._id)?.quantity || 0,
  );
  const inStock = product.stock > 0;
  const url = `/product/${product._id}`;

  // Adds one more unit on top of what is already in the cart (capped by stock).
  const addToCart = async () => {
    if (inCart >= product.stock) return alert.error(t("product.maxStock"));
    setAdding(true);
    try {
      await dispatch(addItemToCart(product._id, inCart + 1));
      alert.success(t("product.added"));
    } catch (error) {
      alert.error(messageFor(error));
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="vx-product-card">
      <Link to={url} className="vx-product-media" tabIndex={-1} aria-hidden="true">
        {product.images?.[0] && <img src={product.images[0].url} alt="" loading="lazy" />}
        <span className="vx-product-cat">{t(`categories.${product.catagory}`, product.catagory)}</span>
        <span className={`vx-product-stock${inStock ? "" : " is-out"}`}>
          {t(inStock ? "product.inStock" : "product.outOfStock")}
        </span>
      </Link>
      <div className="vx-product-body">
        <div className="vx-product-rating">
          <Stars value={product.rating} />
          <span className="vx-product-rating-num">{Number(product.rating || 0).toFixed(1)}</span>
          <span className="vx-muted">({t("product.reviewsCount", { count: product.NumOfReviews || 0 })})</span>
        </div>
        <h2 className="vx-product-name">
          <Link to={url}>{product.name}</Link>
        </h2>
        {product.description && <p className="vx-product-desc">{product.description}</p>}
      </div>
      <div className="vx-product-foot">
        <div>
          <span className="vx-label">{t("product.price")}</span>
          <span className="vx-product-price">{formatPrice(product.price)}</span>
        </div>
        <div className="vx-product-actions">
          <Link to={url} className="vx-icon-btn" aria-label={t("product.view", { name: product.name })}>
            <i className="fa fa-eye" aria-hidden="true" />
          </Link>
          <button
            type="button"
            className="vx-btn vx-btn--primary vx-product-add"
            disabled={!inStock || adding}
            onClick={addToCart}
            aria-label={t("product.addNamed", { name: product.name })}
          >
            <i className="fa fa-cart-plus" aria-hidden="true" />
            <span>{t(adding ? "product.adding" : "product.add")}</span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
