import React, { Fragment, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAlert } from "../ui/Alerts";

import { myAllOrders, clearError } from "../../actions";
import { formatPrice, translateServerError } from "../../i18n";
import MetaDAta from "../layouts/MetaDAta";
import AccountNav from "../user/AccountNav";
import "../user/Account.css";
import "./Orders.css";

export const STATUSES = ["Processing", "Shipped", "Delivered"];
const SORTS = ["recent", "high", "low"];
const PREVIEW_ITEMS = 4;

// UPDATED: Veyra order history (Stitch "my orders" design) built from the user's real orders.
const ListOrders = () => {
  const alert = useAlert();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();

  const { loading, error, orders = [] } = useSelector((state) => state.myOrder);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");

  // UPDATED: fetch once; error in the same effect caused an endless refetch loop
  useEffect(() => {
    dispatch(myAllOrders());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      alert.error(translateServerError(t, error));
      dispatch(clearError());
    }
  }, [dispatch, alert, error, t]);

  const counts = useMemo(
    () => Object.fromEntries(STATUSES.map((s) => [s, orders.filter((o) => o.orderStatus === s).length])),
    [orders],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders
      .filter((o) => tab === "all" || o.orderStatus === tab)
      .filter(
        (o) =>
          !q ||
          o._id.toLowerCase().includes(q) ||
          o.orderItems.some((item) => item.name.toLowerCase().includes(q)),
      )
      .sort((a, b) =>
        sort === "high" ? b.totalPrice - a.totalPrice : sort === "low" ? a.totalPrice - b.totalPrice : new Date(b.createdAt) - new Date(a.createdAt),
      );
  }, [orders, tab, search, sort]);

  const filtered = tab !== "all" || search.trim() !== "";
  const clearFilters = () => {
    setTab("all");
    setSearch("");
  };

  return (
    <Fragment>
      <MetaDAta title={t("orders.list.pageTitle")} />
      <div className="vx-page vx-account">
        <div className="vx-container">
          <div className="vx-account-grid">
            <AccountNav ordersCount={orders.length} />

            <div className="vx-account-main">
              <section className="vx-card vx-account-section vx-orders-head">
                <span className="vx-eyebrow">{t("orders.list.eyebrow")}</span>
                <h1 className="vx-title-xl">{t("orders.list.title")}</h1>
                <p className="vx-muted">{t("orders.list.subtitle")}</p>
              </section>

              {error ? (
                <div className="vx-card vx-state" role="alert">
                  <span className="vx-state-icon"><i className="fa fa-exclamation-triangle" aria-hidden="true" /></span>
                  <p>{t("orders.list.loadError")}</p>
                  <button type="button" className="vx-btn vx-btn--primary" onClick={() => dispatch(myAllOrders())}>
                    {t("orders.list.retry")}
                  </button>
                </div>
              ) : loading ? (
                <div role="status" aria-label="Loading">
                  {[0, 1].map((i) => (
                    <div key={i} className="vx-card vx-order-skeleton" aria-hidden="true" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="vx-card vx-state">
                  <span className="vx-state-icon"><i className="fa fa-file-text-o" aria-hidden="true" /></span>
                  <h2 className="vx-title-md">{t("orders.list.emptyTitle")}</h2>
                  <p>{t("orders.list.emptyText")}</p>
                  <Link to="/" className="vx-btn vx-btn--primary vx-btn--caps">{t("orders.list.emptyCta")}</Link>
                </div>
              ) : (
                <>
                  <div className="vx-card vx-orders-filters">
                    <div className="vx-orders-tabs" role="group" aria-label={t("orders.list.payment")}>
                      <button type="button" aria-pressed={tab === "all"} className={tab === "all" ? "is-active" : ""} onClick={() => setTab("all")}>
                        {t("orders.list.tabAll")} <span>{orders.length}</span>
                      </button>
                      {STATUSES.map((status) => (
                        <button key={status} type="button" aria-pressed={tab === status} className={tab === status ? "is-active" : ""} onClick={() => setTab(status)}>
                          {t(`orders.statuses.${status}`)} <span>{counts[status]}</span>
                        </button>
                      ))}
                    </div>
                    <div className="vx-orders-tools">
                      <div className="vx-orders-search">
                        <i className="fa fa-search" aria-hidden="true" />
                        <input
                          type="search"
                          className="vx-control"
                          aria-label={t("orders.list.searchPlaceholder")}
                          placeholder={t("orders.list.searchPlaceholder")}
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </div>
                      <select className="vx-control" aria-label={t("orders.list.sort")} value={sort} onChange={(e) => setSort(e.target.value)}>
                        {SORTS.map((value) => (
                          <option key={value} value={value}>
                            {t(`orders.list.sort${value[0].toUpperCase()}${value.slice(1)}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {visible.length === 0 ? (
                    <div className="vx-card vx-state">
                      <span className="vx-state-icon"><i className="fa fa-search" aria-hidden="true" /></span>
                      <p>{t("orders.list.noMatch")}</p>
                      {filtered && (
                        <button type="button" className="vx-btn vx-btn--soft" onClick={clearFilters}>{t("orders.list.clearFilters")}</button>
                      )}
                    </div>
                  ) : (
                    visible.map((order) => {
                      const paid = order.paymentInfo && order.paymentInfo.status === "succeeded";
                      const units = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
                      return (
                        <article key={order._id} className="vx-card vx-order-card">
                          <header className="vx-order-top">
                            <dl>
                              <div>
                                <dt>{t("orders.list.orderNumber")}</dt>
                                <dd className="vx-order-id">#{order._id.slice(-8).toUpperCase()}</dd>
                              </div>
                              <div>
                                <dt>{t("orders.list.date")}</dt>
                                <dd>{new Date(order.createdAt).toLocaleDateString(i18n.language, { dateStyle: "medium" })}</dd>
                              </div>
                              <div>
                                <dt>{t("orders.list.total")}</dt>
                                <dd className="vx-order-total">{formatPrice(order.totalPrice)}</dd>
                              </div>
                              <div>
                                <dt>{t("orders.list.payment")}</dt>
                                <dd><span className={`vx-pay-pill${paid ? "" : " is-unpaid"}`}>{t(paid ? "orders.paid" : "orders.notPaid")}</span></dd>
                              </div>
                            </dl>
                            <span className={`vx-status is-${String(order.orderStatus).toLowerCase()}`}>
                              {t(`orders.statuses.${order.orderStatus}`, order.orderStatus)}
                            </span>
                          </header>
                          <div className="vx-order-body">
                            <ul className="vx-order-items">
                              {order.orderItems.slice(0, PREVIEW_ITEMS).map((item) => (
                                <li key={item.product}>
                                  <span className="vx-order-thumb"><img src={item.image} alt="" /></span>
                                  <span className="vx-order-item-info">
                                    <span className="vx-title-sm">{item.name}</span>
                                    <span className="vx-muted">{t("orders.list.qty", { count: item.quantity })} • {formatPrice(item.price)}</span>
                                  </span>
                                </li>
                              ))}
                            </ul>
                            {order.orderItems.length > PREVIEW_ITEMS && (
                              <p className="vx-muted vx-order-more">{t("orders.list.more", { count: order.orderItems.length - PREVIEW_ITEMS })}</p>
                            )}
                            <div className="vx-order-foot">
                              <span className="vx-muted">{t("orders.list.itemsCount", { count: units })}</span>
                              <Link to={`/order/${order._id}`} className="vx-btn vx-btn--primary vx-btn--caps">
                                {t("orders.list.viewDetails")} <i className="fa fa-arrow-right" aria-hidden="true" />
                              </Link>
                            </div>
                          </div>
                        </article>
                      );
                    })
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default ListOrders;
