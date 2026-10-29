import { useNavigate } from "react-router-dom";
import React, { Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAlert } from "../ui/Alerts";

import { addItemToCart, removeItemFromCart } from "../../actions";
import { formatPrice, translateServerError } from "../../i18n";
import { messageFor } from "../../queries/products";
import MetaDAta from "../layouts/MetaDAta";
import { FREE_SHIPPING_FROM, orderTotals } from "./orderTotals";
import "./Cart.css";

const Cart = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const alert = useAlert();
  const { cartItems } = useSelector((state) => state.cart);

  // UPDATED: account-cart writes can fail (stock, network); show a translated message
  const showError = (error) => alert.error(translateServerError(t, messageFor(error)));

  // DECREASE THE QUANTITY

  const decreaseQty = (id, quantity) => {
    const newQty = quantity - 1;
    if (newQty <= 0) return;
    dispatch(addItemToCart(id, newQty)).catch(showError);
  };
  // INCREASE  THE QUANTITY

  const increaseQty = (id, quantity, stock) => {
    const newQty = quantity + 1;
    if (newQty > stock) return;
    dispatch(addItemToCart(id, newQty)).catch(showError);
  };

  // REMOVE FROM CART

  const removeCartItemHandler = (id) => {
    dispatch(removeItemFromCart(id))
      .then(() => alert.success(t("cart.removed")))
      .catch(showError);
  };

  // CLICK ON CHECKOUT BUTTON
  const checkoutHandler = () => {
    navigate("/login?redirect=shipping");
  };

  // UPDATED: same totals as the checkout confirmation step
  const { itemsPrice, shippingPrice, taxPrice, totalPrice } = orderTotals(cartItems);
  const units = cartItems.reduce((acc, item) => acc + Number(item.quantity), 0);
  const freePercent = Math.min(100, Math.round((itemsPrice / FREE_SHIPPING_FROM) * 100));

  return (
    <Fragment>
      <MetaDAta title={t("cart.pageTitle")} />
      {/* UPDATED: Veyra cart (Stitch shopping cart design) */}
      <div className="vx-page">
        <div className="vx-container vx-cart">
          <div className="vx-cart-head">
            <div>
              <ol className="vx-cart-steps">
                <li aria-current="step">{t("cart.steps.cart")}</li>
                <li>{t("cart.steps.shipping")}</li>
                <li>{t("cart.steps.payment")}</li>
              </ol>
              <h1 className="vx-title-xl">
                {t("cart.title")}{" "}
                {cartItems.length > 0 && <span className="vx-cart-count">{t("cart.itemsCount", { count: cartItems.length })}</span>}
              </h1>
              <p className="vx-muted">{t("cart.subtitle")}</p>
            </div>
            <Link to="/" className="vx-cart-continue">
              <i className="fa fa-arrow-left" aria-hidden="true" /> {t("cart.continue")}
            </Link>
          </div>

          {cartItems.length === 0 ? (
            <div className="vx-card vx-state vx-cart-empty">
              <span className="vx-state-icon"><i className="fa fa-shopping-bag" aria-hidden="true" /></span>
              <h2 className="vx-title-md">{t("cart.emptyTitle")}</h2>
              <p>{t("cart.emptyText")}</p>
              <Link to="/" className="vx-btn vx-btn--primary vx-btn--caps">
                {t("cart.emptyCta")}
              </Link>
            </div>
          ) : (
            <Fragment>
              <div className="vx-card vx-cart-free">
                <div className="vx-cart-free-row">
                  <span className="vx-cart-free-icon"><i className="fa fa-truck" aria-hidden="true" /></span>
                  <div>
                    <p className="vx-title-sm">
                      {shippingPrice === 0
                        ? t("cart.freeReached")
                        : t("cart.freeAway", { amount: formatPrice(Math.max(0.01, FREE_SHIPPING_FROM - itemsPrice)) })}
                    </p>
                    <p className="vx-muted">{t("cart.freeHint", { amount: formatPrice(FREE_SHIPPING_FROM) })}</p>
                  </div>
                  <span className="vx-cart-free-pct">{t("cart.freeProgress", { percent: freePercent })}</span>
                </div>
                <div className="vx-cart-progress" role="progressbar" aria-valuenow={freePercent} aria-valuemin={0} aria-valuemax={100}>
                  <span style={{ width: `${freePercent}%` }} />
                </div>
              </div>

              <div className="vx-cart-grid">
                <div className="vx-card vx-cart-items">
                  <div className="vx-cart-row vx-cart-th" aria-hidden="true">
                    <span>{t("cart.product")}</span>
                    <span>{t("cart.unitPrice")}</span>
                    <span>{t("cart.quantity")}</span>
                    <span>{t("cart.subtotal")}</span>
                  </div>
                  {cartItems.map((item) => (
                    <div key={item.product} className="vx-cart-row vx-cart-item">
                      <div className="vx-cart-product">
                        <Link to={`/product/${item.product}`} className="vx-cart-thumb" tabIndex={-1} aria-hidden="true">
                          <img src={item.image} alt="" />
                        </Link>
                        <div className="vx-cart-product-info">
                          <h2 className="vx-title-sm">
                            <Link to={`/product/${item.product}`}>{item.name}</Link>
                          </h2>
                          <button
                            type="button"
                            className="vx-cart-remove"
                            aria-label={t("cart.removeItem", { name: item.name })}
                            onClick={() => removeCartItemHandler(item.product)}
                          >
                            <i className="fa fa-trash-o" aria-hidden="true" /> {t("cart.remove")}
                          </button>
                        </div>
                      </div>
                      <div className="vx-cart-cell" data-label={t("cart.unitPrice")}>
                        <span className="vx-cart-price">{formatPrice(item.price)}</span>
                      </div>
                      <div className="vx-cart-cell vx-cart-cell--qty" data-label={t("cart.quantity")}>
                        <div className="vx-stepper vx-stepper--soft">
                          <button
                            type="button"
                            aria-label={t("cart.decrease", { name: item.name })}
                            disabled={item.quantity <= 1}
                            onClick={() => decreaseQty(item.product, item.quantity)}
                          >
                            <i className="fa fa-minus" aria-hidden="true" />
                          </button>
                          <input aria-label={t("cart.qtyOf", { name: item.name })} type="number" value={item.quantity} readOnly />
                          <button
                            type="button"
                            aria-label={t("cart.increase", { name: item.name })}
                            disabled={item.quantity >= item.stock}
                            onClick={() => increaseQty(item.product, item.quantity, item.stock)}
                          >
                            <i className="fa fa-plus" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <div className="vx-cart-cell" data-label={t("cart.subtotal")}>
                        <strong className="vx-cart-price">{formatPrice(item.price * item.quantity)}</strong>
                      </div>
                    </div>
                  ))}
                </div>

                <aside className="vx-card vx-cart-summary" aria-labelledby="cart-summary-title">
                  <h2 id="cart-summary-title" className="vx-title-sm">{t("cart.summary")}</h2>
                  <dl>
                    <div>
                      <dt>{t("cart.itemsSubtotal", { count: units })}</dt>
                      <dd>{formatPrice(itemsPrice)}</dd>
                    </div>
                    <div>
                      <dt>{t("cart.shipping")}</dt>
                      <dd className={shippingPrice === 0 ? "is-free" : ""}>
                        {shippingPrice === 0 ? t("cart.free") : formatPrice(shippingPrice)}
                      </dd>
                    </div>
                    <div>
                      <dt>{t("cart.tax")}</dt>
                      <dd>{formatPrice(taxPrice)}</dd>
                    </div>
                  </dl>
                  <div className="vx-cart-total">
                    <div>
                      <span className="vx-title-sm">{t("cart.total")}</span>
                      <span className="vx-muted">{t("cart.totalNote")}</span>
                    </div>
                    <strong>{formatPrice(totalPrice)}</strong>
                  </div>
                  <button type="button" className="vx-btn vx-btn--primary vx-btn--caps vx-cart-checkout" onClick={checkoutHandler}>
                    {t("cart.checkout")} <i className="fa fa-lock" aria-hidden="true" />
                  </button>
                  <div className="vx-cart-trust">
                    <p>
                      <i className="fa fa-shield" aria-hidden="true" /> {t("cart.secure")}
                    </p>
                    <div className="vx-footer-pay">
                      <span className="vx-pay-badge">Visa</span>
                      <span className="vx-pay-badge">Mastercard</span>
                      <span className="vx-pay-badge">Stripe</span>
                    </div>
                  </div>
                </aside>
              </div>
            </Fragment>
          )}
        </div>
      </div>
    </Fragment>
  );
};

export default Cart;
