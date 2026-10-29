import { useParams } from "react-router-dom";
import React, { Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAlert } from "../ui/Alerts";

import { getOrderDetails, clearError } from "../../actions";
import { formatPrice, translateServerError, countryLabel } from "../../i18n";
import MetaDAta from "../layouts/MetaDAta";
import Loader from "../layouts/Loader";
import "../user/Account.css";
import "../cart/Checkout.css"; // summary lines, address box, edit links
import "./Orders.css";

// UPDATED: Veyra order details (Stitch design). Only real data: items, totals, payment, the address
// saved on the order and a status timeline built from the order status. No tracking or delivery estimates.
const OrderDetails = () => {
  const params = useParams();
  const { t, i18n } = useTranslation();

  const alert = useAlert();
  const dispatch = useDispatch();
  const [failed, setFailed] = useState(false);

  const { loading, error, order = {} } = useSelector((state) => state.orderDetails);
  const loaded = order._id === params.id; // ignore a previously viewed order
  const { shippingInfo, orderItems = [], paymentInfo, user, totalPrice, orderStatus } = loaded ? order : {};

  const isPaid = Boolean(paymentInfo && paymentInfo.status === "succeeded");

  // UPDATED: fetch once per id; error in the same effect caused an endless refetch loop
  useEffect(() => {
    setFailed(false);
    dispatch(getOrderDetails(params.id));
  }, [dispatch, params.id]);

  useEffect(() => {
    if (error) {
      setFailed(true);
      alert.error(translateServerError(t, error));
      dispatch(clearError());
    }
  }, [dispatch, alert, error, t]);

  const date = (value, options = { dateStyle: "medium" }) => new Date(value).toLocaleString(i18n.language, options);

  if (loading || (!loaded && !failed)) return <Loader />;
  if (!loaded)
    return (
      <div className="vx-page vx-account">
        <div className="vx-container">
          <div className="vx-card vx-state" role="alert">
            <span className="vx-state-icon"><i className="fa fa-exclamation-triangle" aria-hidden="true" /></span>
            <p>{t("orders.detail.loadError")}</p>
            <button type="button" className="vx-btn vx-btn--primary" onClick={() => { setFailed(false); dispatch(getOrderDetails(params.id)); }}>
              {t("orders.detail.retry")}
            </button>{" "}
            <Link to="/orders/me" className="vx-btn vx-btn--soft">{t("orders.detail.back")}</Link>
          </div>
        </div>
      </div>
    );

  const shipped = orderStatus === "Shipped" || orderStatus === "Delivered";
  const delivered = orderStatus === "Delivered";
  const steps = [
    { key: "placed", done: true, text: date(order.createdAt, { dateStyle: "medium", timeStyle: "short" }), desc: t("orders.detail.stepPlacedText") },
    { key: "paid", done: isPaid, text: isPaid && order.paidAt ? date(order.paidAt, { dateStyle: "medium", timeStyle: "short" }) : t("orders.notPaid"), desc: t("orders.detail.stepPaidText") },
    { key: "shipped", done: shipped, text: shipped ? t("orders.detail.stepShippedText") : t("orders.detail.stepShippedPending") },
    { key: "delivered", done: delivered, text: delivered ? t("orders.detail.stepDeliveredText", { date: order.deliveredAt ? date(order.deliveredAt) : "" }) : t("orders.detail.stepDeliveredPending") },
  ];
  const currentIndex = steps.findIndex((s) => !s.done);

  return (
    <Fragment>
      <MetaDAta title={t("orders.detail.pageTitle")} />
      <div className="vx-page vx-account vx-order-detail">
        <div className="vx-container">
          <nav className="vx-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">{t("orders.detail.crumbHome")}</Link>
            <i className="fa fa-angle-right" aria-hidden="true" />
            <Link to="/orders/me">{t("orders.detail.crumbOrders")}</Link>
            <i className="fa fa-angle-right" aria-hidden="true" />
            <span>#{order._id.slice(-8).toUpperCase()}</span>
          </nav>

          <header className="vx-order-title">
            <div>
              <div className="vx-order-title-row">
                <h1 className="vx-title-xl">{t("orders.detail.title", { id: order._id.slice(-8).toUpperCase() })}</h1>
                <span className={`vx-status is-${String(orderStatus).toLowerCase()}`}>{t(`orders.statuses.${orderStatus}`, orderStatus)}</span>
              </div>
              <p className="vx-muted">{t("orders.detail.placedOn", { date: date(order.createdAt, { dateStyle: "long", timeStyle: "short" }) })}</p>
            </div>
            <button type="button" className="vx-btn vx-btn--soft" onClick={() => window.print()}>
              <i className="fa fa-print" aria-hidden="true" /> {t("orders.detail.print")}
            </button>
          </header>

          <section className="vx-card vx-timeline-card" aria-labelledby="timeline-title">
            <span className="vx-eyebrow">{t("orders.detail.timelineEyebrow")}</span>
            <h2 id="timeline-title" className="vx-title-md">{t("orders.detail.timelineTitle")}</h2>
            <ol className="vx-timeline">
              {steps.map((step, index) => (
                <li key={step.key} className={step.done ? "is-done" : index === currentIndex ? "is-current" : ""} aria-current={index === currentIndex ? "step" : undefined}>
                  <span className="vx-timeline-dot" aria-hidden="true">
                    {step.done ? <i className="fa fa-check" /> : index + 1}
                  </span>
                  <span className="vx-timeline-text">
                    <span className="vx-label">{t("orders.detail.step", { n: index + 1 })}</span>
                    <strong>{t(`orders.detail.step${step.key[0].toUpperCase()}${step.key.slice(1)}`)}</strong>
                    <span className="vx-muted">{step.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <div className="vx-detail-grid">
            <section className="vx-card vx-account-section">
              <div className="vx-account-section-head vx-account-section-head--line">
                <h2 className="vx-title-md">{t("orders.detail.itemsTitle")}</h2>
                <span className="vx-muted">{t("orders.detail.products", { count: orderItems.length })}</span>
              </div>
              <ul className="vx-detail-items">
                {orderItems.map((item) => (
                  <li key={item.product}>
                    <Link to={`/product/${item.product}`} className="vx-order-thumb vx-order-thumb--lg" aria-label={item.name}>
                      <img src={item.image} alt="" />
                    </Link>
                    <div className="vx-detail-item-info">
                      <h3 className="vx-title-sm">{item.name}</h3>
                      <p className="vx-muted">{t("orders.detail.qty", { count: item.quantity })} • {t("orders.detail.unit", { price: formatPrice(item.price) })}</p>
                      <Link to={`/product/${item.product}`} className="vx-edit-link">{t("orders.detail.viewProduct")}</Link>
                    </div>
                    <strong className="vx-review-price">{formatPrice(item.price * item.quantity)}</strong>
                  </li>
                ))}
              </ul>
            </section>

            <aside className="vx-detail-side">
              <section className="vx-card vx-account-section">
                <h2 className="vx-title-sm">{t("orders.detail.summaryTitle")}</h2>
                <dl className="vx-summary-lines vx-detail-lines">
                  <div><dt>{t("orders.detail.subtotal")}</dt><dd>{formatPrice(order.itemsPrice)}</dd></div>
                  <div>
                    <dt>{t("orders.detail.shipping")}</dt>
                    <dd className={Number(order.shippingPrice) === 0 ? "is-free" : ""}>{Number(order.shippingPrice) === 0 ? t("orders.detail.free") : formatPrice(order.shippingPrice)}</dd>
                  </div>
                  <div><dt>{t("orders.detail.tax")}</dt><dd>{formatPrice(order.taxPrice)}</dd></div>
                </dl>
                <div className="vx-summary-total"><span>{t("orders.detail.total")}</span><strong>{formatPrice(totalPrice)}</strong></div>
              </section>

              <section className="vx-card vx-account-section">
                <h2 className="vx-title-sm">{t("orders.detail.paymentTitle")}</h2>
                <dl className="vx-detail-facts">
                  <div><dt>{t("orders.detail.paymentStatus")}</dt><dd><span className={`vx-pay-pill${isPaid ? "" : " is-unpaid"}`}>{t(isPaid ? "orders.paid" : "orders.notPaid")}</span></dd></div>
                  <div><dt>{t("orders.detail.paymentMethod")}</dt><dd>{t("orders.detail.methodValue")}</dd></div>
                  {paymentInfo && paymentInfo.id && <div><dt>{t("orders.detail.paymentRef")}</dt><dd className="vx-mono">{paymentInfo.id.slice(-10)}</dd></div>}
                </dl>
              </section>

              <section className="vx-card vx-account-section">
                <h2 className="vx-title-sm">{t("orders.detail.shippingTitle")}</h2>
                <div className="vx-recap-box">
                  {user && user.name && <p className="vx-title-sm">{user.name}</p>}
                  {shippingInfo && (
                    <p className="vx-muted">
                      {shippingInfo.address}
                      <br />
                      {shippingInfo.postalCode} {shippingInfo.city}, {countryLabel(shippingInfo.country)}
                      <br />
                      {t("orders.detail.contact")}: {shippingInfo.phoneNo}
                    </p>
                  )}
                </div>
                <p className="vx-field-hint">{t("orders.detail.notePrice")}</p>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default OrderDetails;
