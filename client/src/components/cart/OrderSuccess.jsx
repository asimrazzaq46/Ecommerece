import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import MetaDAta from "../layouts/MetaDAta";
import { formatPrice } from "../../i18n";
import OrderSummary from "./OrderSummary";
import "./Checkout.css";

// UPDATED: Veyra order confirmation (Stitch "order success" design), using the order just saved.
// After a refresh the order is no longer in memory, so a short generic confirmation is shown.
const OrderSuccess = () => {
  const { t, i18n } = useTranslation();
  const order = useSelector((state) => state.newOrder.order?.order);
  const user = useSelector((state) => state.auth.user);
  const firstName = user?.name?.split(" ")[0];
  const shortId = order?._id?.slice(-8).toUpperCase();

  return (
    <Fragment>
      <MetaDAta title={t("checkout.success.pageTitle")} />
      <div className="vx-page vx-checkout vx-success">
        <div className="vx-container">
          <section className="vx-card vx-success-hero">
            <span className="vx-success-icon"><i className="fa fa-check" aria-hidden="true" /></span>
            <span className="vx-eyebrow">{t("checkout.success.eyebrow")}</span>
            <h1 className="vx-success-title">
              {firstName ? t("checkout.success.titleNamed", { name: firstName }) : t("checkout.success.title")}
            </h1>
            <p className="vx-muted">{order ? t("checkout.success.text") : t("checkout.success.fallback")}</p>

            {order && (
              <dl className="vx-success-facts">
                <div>
                  <dt>{t("checkout.success.orderNumber")}</dt>
                  <dd>#{shortId}</dd>
                </div>
                <div>
                  <dt>{t("checkout.success.orderDate")}</dt>
                  <dd>{new Date(order.createdAt || Date.now()).toLocaleDateString(i18n.language, { dateStyle: "medium" })}</dd>
                </div>
                <div>
                  <dt>{t("checkout.success.destination")}</dt>
                  <dd>{[order.shippingInfo?.city, order.shippingInfo?.country].filter(Boolean).join(", ")}</dd>
                </div>
                <div>
                  <dt>{t("checkout.success.status")}</dt>
                  <dd>{t("checkout.success.paid")} • {formatPrice(order.totalPrice)}</dd>
                </div>
              </dl>
            )}

            <div className="vx-success-actions">
              {order ? (
                <Link to={`/order/${order._id}`} className="vx-btn vx-btn--primary">
                  <i className="fa fa-file-text-o" aria-hidden="true" /> {t("checkout.success.viewOrder")}
                </Link>
              ) : (
                <Link to="/orders/me" className="vx-btn vx-btn--primary">{t("checkout.success.myOrders")}</Link>
              )}
              {order && (
                <button type="button" className="vx-btn vx-btn--soft" onClick={() => window.print()}>
                  <i className="fa fa-print" aria-hidden="true" /> {t("checkout.success.print")}
                </button>
              )}
              <Link to="/" className="vx-success-continue">{t("checkout.success.continue")}</Link>
            </div>
          </section>

          {order && (
            <div className="vx-success-grid">
              <section className="vx-card vx-checkout-card">
                <h2 className="vx-title-sm">{t("checkout.success.deliveryTitle")}</h2>
                <div className="vx-recap-box">
                  <p className="vx-title-sm">{user?.name}</p>
                  <p className="vx-muted">
                    {order.shippingInfo?.address}
                    <br />
                    {order.shippingInfo?.postalCode} {order.shippingInfo?.city}, {order.shippingInfo?.country}
                    <br />
                    {order.shippingInfo?.phoneNo}
                  </p>
                </div>
              </section>
              <OrderSummary
                items={order.orderItems || []}
                editable={false}
                totals={{ itemsPrice: order.itemsPrice, shippingPrice: order.shippingPrice, taxPrice: order.taxPrice, totalPrice: order.totalPrice }}
              />
            </div>
          )}
        </div>
      </div>
    </Fragment>
  );
};

export default OrderSuccess;
