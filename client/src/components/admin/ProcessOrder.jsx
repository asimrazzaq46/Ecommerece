import { useParams, Link } from "react-router-dom";
import React, { Fragment, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useAlert } from "../ui/Alerts";

import { updateOrder, getOrderDetails, clearError } from "../../actions";
import { formatPrice, translateServerError, countryLabel } from "../../i18n";
import MetaDAta from "../layouts/MetaDAta";
import Select from "../ui/Select";
import Loader from "../layouts/Loader";
import AdminLayout from "./AdminLayout";
import AdminHead from "./AdminHead";
import { shortId } from "./OrdersList";
import { UPDATE_ORDER_RESET } from "../../constants/orderConstants";
import "../orders/Orders.css"; // status + payment pills
import "./ProductAdmin.css";

// Mirrors the server rules (adminController.updateOrder): orders only move forward.
const NEXT = { Processing: ["Processing", "Shipped", "Delivered"], Shipped: ["Shipped", "Delivered"], Delivered: ["Delivered"] };

// UPDATED: Veyra "process order" (Stitch design): status pipeline, items, customer, address, payment, history.
const ProcessOrder = () => {
  const params = useParams();
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState("");

  const alert = useAlert();
  const dispatch = useDispatch();

  const { loading, error, order = {} } = useSelector((state) => state.orderDetails);
  const { error: updateError, isUpdated, loading: saving } = useSelector((state) => state.order);
  const orderId = params.id;
  const loaded = order._id === orderId;
  const { shippingInfo, orderItems = [], paymentInfo, user, orderStatus } = loaded ? order : {};
  const isPaid = Boolean(paymentInfo && paymentInfo.status === "succeeded");
  const options = NEXT[orderStatus] || [];
  const locked = !isPaid || orderStatus === "Delivered";

  useEffect(() => { setStatus(orderStatus || "Processing"); }, [orderStatus, orderId]);

  useEffect(() => {
    dispatch(getOrderDetails(orderId));
  }, [dispatch, orderId]);

  useEffect(() => {
    if (updateError) {
      alert.error(translateServerError(t, updateError));
      dispatch(clearError());
    }
    if (isUpdated) {
      alert.success(t("adminOrders.process.updated"));
      dispatch({ type: UPDATE_ORDER_RESET });
      dispatch(getOrderDetails(orderId));
    }
  }, [dispatch, alert, updateError, isUpdated, orderId, t]);

  useEffect(() => {
    if (error) {
      alert.error(translateServerError(t, error));
      dispatch(clearError());
    }
  }, [dispatch, alert, error, t]);

  const stamp = (value) => new Date(value).toLocaleString(i18n.language, { dateStyle: "medium", timeStyle: "short" });

  if (loading && !loaded) return <Loader />;
  if (!loaded)
    return (
      <AdminLayout title={t("adminOrders.process.pageTitle")}>
        <div className="vx-card vx-state" role="alert">
          <span className="vx-state-icon"><i className="fa fa-exclamation-triangle" aria-hidden="true" /></span>
          <p>{t("adminOrders.process.loadError")}</p>
          <button type="button" className="vx-btn vx-btn--primary" onClick={() => dispatch(getOrderDetails(orderId))}>{t("adminOrders.process.retry")}</button>{" "}
          <Link to="/admin/orders" className="vx-btn vx-btn--soft">{t("adminOrders.process.back")}</Link>
        </div>
      </AdminLayout>
    );

  const events = [
    { key: "tPlaced", at: order.createdAt },
    isPaid && { key: "tPaid", at: order.paidAt },
    (orderStatus === "Shipped" || orderStatus === "Delivered") && { key: "tShipped" },
    orderStatus === "Delivered" && { key: "tDelivered", at: order.deliveredAt },
  ].filter(Boolean);

  return (
    <Fragment>
      <MetaDAta title={t("adminOrders.process.pageTitle")} />
      <AdminLayout title={t("adminOrders.process.pageTitle")}>
        <AdminHead
          crumbs={[{ label: t("adminOrders.process.crumbOrders"), to: "/admin/orders" }, { label: `#${shortId(order._id)}` }]}
          title={t("adminOrders.process.title", { id: shortId(order._id) })}
          subtitle={t("adminOrders.process.placedOn", { date: stamp(order.createdAt) })}
        >
          <div className="vx-pm-actions">
            <span className={`vx-status is-${String(orderStatus).toLowerCase()}`}>{t(`orders.statuses.${orderStatus}`, orderStatus)}</span>
            <button type="button" className="vx-btn vx-btn--soft" onClick={() => window.print()}>
              <i className="fa fa-print" aria-hidden="true" /> {t("adminOrders.process.print")}
            </button>
          </div>
        </AdminHead>

        <div className="vx-po">
          <div className="vx-po-main">
            <section className="vx-card vx-pf-card">
              <span className="vx-eyebrow">{t("adminOrders.process.pipelineEyebrow")}</span>
              <h2 className="vx-title-md">{t("adminOrders.process.pipelineTitle")}</h2>
              <p className="vx-muted">{t("adminOrders.process.pipelineText")}</p>
              <div className="vx-po-status">
                <div className="vx-field">
                  <label htmlFor="status_field" className="vx-field-label">{t("adminOrders.process.action")}</label>
                  <Select id="status_field" className="vx-select-wrap--block" value={status} disabled={locked} onChange={setStatus} label={t("adminOrders.process.action")} options={options.map((s) => ({ value: s, label: t(`orders.statuses.${s}`) }))} />
                </div>
                <button
                  type="button"
                  className="vx-btn vx-btn--primary vx-btn--caps"
                  disabled={locked || saving || status === orderStatus}
                  onClick={() => { const formData = new FormData(); formData.set("status", status); dispatch(updateOrder(order._id, formData)); }}
                >
                  <i className="fa fa-check" aria-hidden="true" /> {t(saving ? "adminOrders.process.saving" : "adminOrders.process.save")}
                </button>
              </div>
              {!isPaid && <p className="vx-field-hint">{t("adminOrders.process.notPaidNote")}</p>}
              {isPaid && orderStatus === "Delivered" && <p className="vx-field-hint">{t("adminOrders.process.finalNote")}</p>}
            </section>

            <section className="vx-card vx-pm-card">
              <div className="vx-pf-card">
                <h2 className="vx-title-md">{t("adminOrders.process.itemsTitle")}</h2>
                <p className="vx-muted">{t("adminOrders.process.itemsText", { count: orderItems.length })}</p>
              </div>
              <div className="vx-table-wrap">
                <table className="vx-table vx-pm-table">
                  <thead>
                    <tr>
                      <th>{t("adminOrders.process.product")}</th>
                      <th>{t("adminOrders.process.unit")}</th>
                      <th>{t("adminOrders.process.qty")}</th>
                      <th>{t("adminOrders.process.lineTotal")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item) => (
                      <tr key={item.product}>
                        <td>
                          <span className="vx-pm-product">
                            <img src={item.image} alt="" />
                            <Link to={`/product/${item.product}`} className="vx-cell-main vx-pm-name">{item.name}</Link>
                          </span>
                        </td>
                        <td>{formatPrice(item.price)}</td>
                        <td>{item.quantity}</td>
                        <td className="vx-cell-main">{formatPrice(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="vx-po-side">
            <section className="vx-card vx-pf-card">
              <h2 className="vx-title-sm">{t("adminOrders.process.customerTitle")}</h2>
              <p className="vx-po-line"><strong>{user?.name || t("adminOrders.list.unknownCustomer")}</strong></p>
              {user?.email && <p className="vx-muted">{user.email}</p>}
            </section>

            <section className="vx-card vx-pf-card">
              <h2 className="vx-title-sm">{t("adminOrders.process.addressTitle")}</h2>
              {shippingInfo && (
                <p className="vx-muted vx-po-line">
                  {shippingInfo.address}
                  <br />
                  {shippingInfo.postalCode} {shippingInfo.city}, {countryLabel(shippingInfo.country)}
                  <br />
                  {shippingInfo.phoneNo}
                </p>
              )}
            </section>

            <section className="vx-card vx-pf-card">
              <h2 className="vx-title-sm">{t("adminOrders.process.paymentTitle")}</h2>
              <dl className="vx-detail-facts">
                <div><dt>{t("adminOrders.process.paymentStatus")}</dt><dd><span className={`vx-pay-pill${isPaid ? "" : " is-unpaid"}`}>{t(isPaid ? "orders.paid" : "orders.notPaid")}</span></dd></div>
                {paymentInfo && paymentInfo.id && <div><dt>{t("adminOrders.process.paymentId")}</dt><dd className="vx-mono vx-po-break">{paymentInfo.id}</dd></div>}
                <div><dt>{t("adminOrders.process.subtotal")}</dt><dd>{formatPrice(order.itemsPrice)}</dd></div>
                <div><dt>{t("adminOrders.process.shipping")}</dt><dd>{Number(order.shippingPrice) === 0 ? t("adminOrders.process.free") : formatPrice(order.shippingPrice)}</dd></div>
                <div><dt>{t("adminOrders.process.tax")}</dt><dd>{formatPrice(order.taxPrice)}</dd></div>
                <div className="vx-po-total"><dt>{t("adminOrders.process.grandTotal")}</dt><dd>{formatPrice(order.totalPrice)}</dd></div>
              </dl>
            </section>

            <section className="vx-card vx-pf-card">
              <h2 className="vx-title-sm">{t("adminOrders.process.timelineTitle")}</h2>
              <ol className="vx-po-history">
                {events.map((event) => (
                  <li key={event.key}>
                    <strong>{t(`adminOrders.process.${event.key}`)}</strong>
                    {event.at && <span className="vx-muted">{stamp(event.at)}</span>}
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>
      </AdminLayout>
    </Fragment>
  );
};

export default ProcessOrder;
