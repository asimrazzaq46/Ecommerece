import { useNavigate } from "react-router-dom";
import React, { Fragment } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import MetaDAta from "../layouts/MetaDAta";
import { formatPrice, countryLabel } from "../../i18n";
import CheckoutSteps from "./CheckoutSteps";
import OrderSummary from "./OrderSummary";
import { orderTotals } from "./orderTotals";

const ConfirmOrder = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { cartItems, shippingInfo } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  //   CALCULATE ORDER PRICES

  // UPDATED: shared with the cart summary
  const totals = orderTotals(cartItems);
  const { itemsPrice, shippingPrice, taxPrice, totalPrice } = totals;

  const proceedToPayment = () => {
    const data = {
      itemsPrice: itemsPrice.toFixed(2),
      shippingPrice,
      taxPrice,
      totalPrice,
    };
    sessionStorage.setItem("orderInfo", JSON.stringify(data));
    navigate("/payment");
  };

  // UPDATED: guard against opening this step without a cart or an address
  const missing = !cartItems.length
    ? { text: "checkout.confirm.empty", to: "/cart", cta: "checkout.confirm.goToCart" }
    : !shippingInfo.address
      ? { text: "checkout.confirm.noAddress", to: "/shipping", cta: "checkout.confirm.goToShipping" }
      : null;

  return (
    <Fragment>
      <MetaDAta title={t("checkout.confirm.pageTitle")} />
      {/* UPDATED: Veyra review step (Stitch "order confirmation" design) */}
      <div className="vx-page vx-checkout">
        <CheckoutSteps shipping ConfirmOrder />
        {missing ? (
          <div className="vx-container">
            <div className="vx-card vx-state vx-checkout-state">
              <span className="vx-state-icon"><i className="fa fa-info" aria-hidden="true" /></span>
              <p>{t(missing.text)}</p>
              <Link to={missing.to} className="vx-btn vx-btn--primary">{t(missing.cta)}</Link>
            </div>
          </div>
        ) : (
          <div className="vx-container vx-checkout-grid vx-checkout-grid--wide">
            <div className="vx-checkout-main">
              <div className="vx-checkout-head">
                <span className="vx-eyebrow-dot">{t("checkout.confirm.eyebrow")}</span>
                <h1 className="vx-title-xl">{t("checkout.confirm.title")}</h1>
                <p className="vx-muted">{t("checkout.confirm.subtitle")}</p>
              </div>

              <section className="vx-card vx-checkout-card">
                <div className="vx-card-title-row">
                  <h2 className="vx-title-md"><span className="vx-card-index">01</span> {t("checkout.confirm.delivery")}</h2>
                  <Link to="/shipping" className="vx-edit-link"><i className="fa fa-pencil" aria-hidden="true" /> {t("checkout.confirm.edit")}</Link>
                </div>
                <div className="vx-address-grid">
                  <div>
                    <p className="vx-title-sm">{user && user.name}</p>
                    <p className="vx-muted">
                      {shippingInfo.address}
                      <br />
                      {shippingInfo.postalCode} {shippingInfo.city}
                      <br />
                      {countryLabel(shippingInfo.country)}
                    </p>
                  </div>
                  <div>
                    <span className="vx-label">{t("checkout.confirm.contact")}</span>
                    <p>{user && user.email}</p>
                    <p className="vx-muted">{shippingInfo.phoneNo}</p>
                  </div>
                </div>
              </section>

              <section className="vx-card vx-checkout-card">
                <div className="vx-card-title-row">
                  <h2 className="vx-title-md"><span className="vx-card-index">02</span> {t("checkout.confirm.items")} ({cartItems.length})</h2>
                  <Link to="/cart" className="vx-edit-link"><i className="fa fa-pencil" aria-hidden="true" /> {t("checkout.confirm.editCart")}</Link>
                </div>
                <ul className="vx-review-items">
                  {cartItems.map((item) => (
                    <li key={item.product}>
                      <span className="vx-review-thumb"><img src={item.image} alt="" /></span>
                      <span className="vx-review-info">
                        <Link to={`/product/${item.product}`} className="vx-title-sm">{item.name}</Link>
                        <span className="vx-muted">{t("checkout.confirm.qty", { count: item.quantity })} × {formatPrice(item.price)}</span>
                      </span>
                      <strong className="vx-review-price">{formatPrice(item.quantity * item.price)}</strong>
                    </li>
                  ))}
                </ul>
              </section>

              <div className="vx-checkout-actions">
                <Link to="/shipping" className="vx-back-link">
                  <i className="fa fa-arrow-left" aria-hidden="true" /> {t("checkout.confirm.back")}
                </Link>
                <button className="vx-btn vx-btn--primary vx-checkout-next" disabled={!cartItems.length} onClick={proceedToPayment}>
                  {t("checkout.confirm.submit", { total: formatPrice(totalPrice) })} <i className="fa fa-arrow-right" aria-hidden="true" />
                </button>
              </div>
            </div>

            <OrderSummary items={cartItems} totals={totals} showItems={false} note={t("checkout.summary.estimate")} />
          </div>
        )}
      </div>
    </Fragment>
  );
};

export default ConfirmOrder;
