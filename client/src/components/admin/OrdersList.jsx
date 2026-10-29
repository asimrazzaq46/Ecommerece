import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useAlert } from "../ui/Alerts";
import Pagination from "../ui/Pagination";
import ConfirmDialog from "../ui/ConfirmDialog";

import { allOrders, deleteOrder, clearError } from "../../actions";
import { formatPrice, translateServerError } from "../../i18n";
import MetaDAta from "../layouts/MetaDAta";
import AdminLayout from "./AdminLayout";
import AdminHead, { Kpi } from "./AdminHead";
import { DELETE_ORDER_RESET } from "../../constants/orderConstants";
import "../orders/Orders.css"; // payment + status pills
import "./ProductAdmin.css";

const PAGE_SIZE = 10;
const STATUSES = ["Processing", "Shipped", "Delivered"];
const SORTS = ["Recent", "High", "Low"];
export const shortId = (id) => id.slice(-8).toUpperCase();

// UPDATED: Veyra admin orders (Stitch orders management): real orders, filters, search, pagination, confirmed delete.
const OrdersList = () => {
  const alert = useAlert();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();

  const { error, loading, orders = [], totalAmount = 0 } = useSelector((state) => state.allOrders);
  const { isDeleted, error: deleteError } = useSelector((state) => state.order);

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Recent");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // UPDATED: refetch only on mount and after a delete, not on every error change
  useEffect(() => {
    if (!isDeleted) dispatch(allOrders());
  }, [dispatch, isDeleted]);

  useEffect(() => {
    if (error) {
      alert.error(translateServerError(t, error));
      dispatch(clearError());
    }
    if (deleteError) {
      alert.error(translateServerError(t, deleteError));
      dispatch(clearError());
      setDeleting(false);
    }
    if (isDeleted) {
      alert.success(t("adminOrders.list.deleted"));
      dispatch({ type: DELETE_ORDER_RESET });
      setDeleting(false);
      setToDelete(null);
    }
  }, [dispatch, alert, error, deleteError, isDeleted, t]);

  const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s, orders.filter((o) => o.orderStatus === s).length])), [orders]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders
      .filter((o) => tab === "all" || o.orderStatus === tab)
      .filter(
        (o) =>
          !q ||
          o._id.toLowerCase().includes(q) ||
          (o.user?.name || "").toLowerCase().includes(q) ||
          (o.user?.email || "").toLowerCase().includes(q) ||
          (o.paymentInfo?.id || "").toLowerCase().includes(q),
      )
      .sort((a, b) =>
        sort === "High" ? b.totalPrice - a.totalPrice : sort === "Low" ? a.totalPrice - b.totalPrice : new Date(b.createdAt) - new Date(a.createdAt),
      );
  }, [orders, tab, search, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const filtered = tab !== "all" || search.trim() !== "";
  const reset = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const date = (value) => new Date(value).toLocaleDateString(i18n.language, { dateStyle: "medium" });

  return (
    <Fragment>
      <MetaDAta title={t("adminOrders.list.pageTitle")} />
      <AdminLayout title={t("admin.nav.orders")}>
        <AdminHead crumbs={[{ label: t("adminOrders.list.title") }]} title={t("adminOrders.list.title")} subtitle={t("adminOrders.list.subtitle")} />

        <div className="vx-kpis">
          <Kpi icon="fa-shopping-bag" label={t("adminOrders.list.kpiOrders")} value={loading ? "…" : orders.length} />
          <Kpi icon="fa-clock-o" label={t("adminOrders.list.kpiProcessing")} value={loading ? "…" : counts.Processing} />
          <Kpi icon="fa-check-circle-o" label={t("adminOrders.list.kpiDelivered")} value={loading ? "…" : counts.Delivered} />
          <Kpi icon="fa-money" label={t("adminOrders.list.kpiRevenue")} value={loading ? "…" : formatPrice(totalAmount)} />
        </div>

        <section className="vx-card vx-pm-card">
          <div className="vx-pm-tools">
            <div className="vx-pm-tabs" role="group" aria-label={t("adminOrders.list.status")}>
              {["all", ...STATUSES].map((key) => (
                <button key={key} type="button" aria-pressed={tab === key} className={tab === key ? "is-active" : ""} onClick={() => reset(setTab)(key)}>
                  {key === "all" ? t("adminOrders.list.tabAll") : t(`adminOrders.list.tab${key}`)} <span>{key === "all" ? orders.length : counts[key]}</span>
                </button>
              ))}
            </div>
            <div className="vx-pm-filters vx-pm-filters--two">
              <div className="vx-pm-search">
                <i className="fa fa-search" aria-hidden="true" />
                <input type="search" className="vx-control" aria-label={t("adminOrders.list.searchPlaceholder")} placeholder={t("adminOrders.list.searchPlaceholder")} value={search} onChange={(e) => reset(setSearch)(e.target.value)} />
              </div>
              <select className="vx-control" aria-label={t("adminOrders.list.sortLabel")} value={sort} onChange={(e) => reset(setSort)(e.target.value)}>
                {SORTS.map((key) => (
                  <option key={key} value={key}>{t(`adminOrders.list.sort${key}`)}</option>
                ))}
              </select>
            </div>
          </div>

          {error ? (
            <div className="vx-state" role="alert">
              <span className="vx-state-icon"><i className="fa fa-exclamation-triangle" aria-hidden="true" /></span>
              <p>{t("adminOrders.list.loadError")}</p>
              <button type="button" className="vx-btn vx-btn--primary" onClick={() => dispatch(allOrders())}>{t("adminOrders.list.retry")}</button>
            </div>
          ) : loading ? (
            <p className="vx-chart-empty" role="status">…</p>
          ) : orders.length === 0 ? (
            <div className="vx-state">
              <span className="vx-state-icon"><i className="fa fa-file-text-o" aria-hidden="true" /></span>
              <h2 className="vx-title-md">{t("adminOrders.list.emptyTitle")}</h2>
              <p>{t("adminOrders.list.emptyText")}</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="vx-state">
              <span className="vx-state-icon"><i className="fa fa-search" aria-hidden="true" /></span>
              <p>{t("adminOrders.list.noMatch")}</p>
              {filtered && <button type="button" className="vx-btn vx-btn--soft" onClick={() => { setTab("all"); setSearch(""); setPage(1); }}>{t("adminOrders.list.clearFilters")}</button>}
            </div>
          ) : (
            <>
              <div className="vx-table-wrap">
                <table className="vx-table vx-pm-table">
                  <thead>
                    <tr>
                      <th>{t("adminOrders.list.order")}</th>
                      <th>{t("adminOrders.list.date")}</th>
                      <th>{t("adminOrders.list.customer")}</th>
                      <th>{t("adminOrders.list.items")}</th>
                      <th>{t("adminOrders.list.total")}</th>
                      <th>{t("adminOrders.list.payment")}</th>
                      <th>{t("adminOrders.list.status")}</th>
                      <th><span className="vx-sr-only">{t("adminOrders.list.actions")}</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((order) => {
                      const paid = order.paymentInfo && order.paymentInfo.status === "succeeded";
                      const units = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
                      const name = order.user?.name || t("adminOrders.list.unknownCustomer");
                      return (
                        <tr key={order._id}>
                          <td><Link to={`/admin/order/${order._id}`} className="vx-mono vx-cell-main">#{shortId(order._id)}</Link></td>
                          <td>{date(order.createdAt)}</td>
                          <td>
                            <span className="vx-pm-product">
                              <span className="vx-initials" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
                              <span>
                                <span className="vx-cell-main">{name}</span>
                                <span className="vx-cell-sub">{order.user?.email || order.shippingInfo?.city}</span>
                              </span>
                            </span>
                          </td>
                          <td>
                            <span className="vx-thumbs">
                              {order.orderItems.slice(0, 3).map((item) => <img key={item.product} src={item.image} alt="" />)}
                              <span className="vx-cell-sub">{t("adminOrders.list.itemsCount", { count: units })}</span>
                            </span>
                          </td>
                          <td className="vx-cell-main">{formatPrice(order.totalPrice)}</td>
                          <td><span className={`vx-pay-pill${paid ? "" : " is-unpaid"}`}>{t(paid ? "orders.paid" : "orders.notPaid")}</span></td>
                          <td><span className={`vx-status is-${String(order.orderStatus).toLowerCase()}`}>{t(`orders.statuses.${order.orderStatus}`, order.orderStatus)}</span></td>
                          <td>
                            <span className="vx-pm-actions">
                              <Link to={`/admin/order/${order._id}`} className="vx-btn vx-btn--soft vx-btn--sm" aria-label={t("adminOrders.list.processNamed", { id: shortId(order._id) })}>
                                {t("adminOrders.list.process")}
                              </Link>
                              <button type="button" className="vx-icon-btn vx-icon-btn--danger" aria-label={t("adminOrders.list.deleteNamed", { id: shortId(order._id) })} title={t("adminOrders.list.delete")} onClick={() => setToDelete(order)}>
                                <i className="fa fa-trash-o" aria-hidden="true" />
                              </button>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="vx-pm-foot">
                <span className="vx-muted">{t("adminOrders.list.showing", { from: (current - 1) * PAGE_SIZE + 1, to: Math.min(current * PAGE_SIZE, rows.length), total: rows.length })}</span>
                <Pagination activePage={current} itemsCountPerPage={PAGE_SIZE} totalItemsCount={rows.length} onChange={setPage} />
              </div>
            </>
          )}
        </section>
      </AdminLayout>

      <ConfirmDialog
        open={Boolean(toDelete)}
        busy={deleting}
        title={t("adminOrders.list.confirmTitle")}
        text={toDelete ? t("adminOrders.list.confirmText", { id: shortId(toDelete._id) }) : ""}
        confirmLabel={t(deleting ? "adminOrders.list.deleting" : "adminOrders.list.confirmDelete")}
        cancelLabel={t("adminOrders.list.confirmCancel")}
        onConfirm={() => { setDeleting(true); dispatch(deleteOrder(toDelete._id)); }}
        onCancel={() => setToDelete(null)}
      />
    </Fragment>
  );
};

export default OrdersList;
