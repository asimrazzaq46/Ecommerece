import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useTranslation } from "react-i18next";

import { messageFor } from "../../queries/products";
import { formatPrice } from "../../i18n";
import MetaDAta from "../layouts/MetaDAta";
import AdminLayout from "./AdminLayout";


const LOW_STOCK = 5;

// The server returns only months that have orders; this fills the last 6 calendar months (current included).
export const fillMonths = (rows, now = new Date()) =>
  Array.from({ length: 6 }, (_, i) => {
    const start = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const row = rows.find((r) => r.year === start.getFullYear() && r.month === start.getMonth() + 1);
    return { start, revenue: row ? row.revenue : 0, orders: row ? row.orders : 0 };
  });

// UPDATED: Veyra admin dashboard (Stitch design) built only from real orders, users and products.
const Dashboard = () => {
  const { t, i18n } = useTranslation();

  // UPDATED: one aggregated request instead of downloading every order, user and product
  const query = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async ({ signal }) => (await axios.get("/api/v1/admin/stats", { signal })).data.stats,
  });
  const stats = query.data;
  const pending = query.isPending;
  const error = query.error ? messageFor(query.error) : null;
  const retry = () => query.refetch();

  const recent = stats?.recent || [];
  const stockList = stats?.lowStock || [];
  const months = fillMonths(stats?.monthly || []);
  const maxRevenue = Math.max(1, ...months.map((m) => m.revenue));

  const kpis = [
    { icon: "fa-money", label: t("admin.dashboard.revenue"), value: formatPrice(stats?.revenue || 0), note: t("admin.dashboard.revenueNote") },
    { icon: "fa-shopping-bag", label: t("admin.dashboard.orders"), value: stats?.orders ?? 0, note: t("admin.dashboard.processing", { count: stats?.processing ?? 0 }) },
    { icon: "fa-users", label: t("admin.dashboard.customers"), value: stats?.users ?? 0, note: t("admin.dashboard.newThisMonth", { count: stats?.newUsers ?? 0 }) },
    {
      icon: "fa-cube",
      label: t("admin.dashboard.products"),
      value: stats?.products ?? 0,
      note: `${t("admin.dashboard.outOfStock", { count: stats?.outOfStock ?? 0 })} • ${t("admin.dashboard.lowStock", { count: stats?.lowStockCount ?? 0 })}`,
      alert: (stats?.outOfStock ?? 0) > 0,
    },
  ];

  return (
    <Fragment>
      <MetaDAta title={t("admin.dashboard.pageTitle")} />
      <AdminLayout title={t("admin.nav.dashboard")}>
        <div className="vx-dash-head">
          <div>
            <span className="vx-eyebrow-dot">{t("admin.dashboard.eyebrow")}</span>
            <h1 className="vx-title-xl">{t("admin.dashboard.title")}</h1>
            <p className="vx-muted">{t("admin.dashboard.subtitle")}</p>
          </div>
          <Link to="/admin/product" className="vx-btn vx-btn--primary">
            <i className="fa fa-plus" aria-hidden="true" /> {t("admin.dashboard.addProduct")}
          </Link>
        </div>

        {error && (
          <div className="vx-form-alert vx-dash-alert" role="alert">
            {t("admin.dashboard.loadError")} ({error}){" "}
            <button type="button" className="vx-link-btn" onClick={retry}>{t("admin.dashboard.retry")}</button>
          </div>
        )}

        <div className="vx-kpis">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="vx-card vx-kpi">
              <div className="vx-kpi-top">
                <span className="vx-kpi-label">{kpi.label}</span>
                <span className={`vx-kpi-icon${kpi.alert ? " is-alert" : ""}`}><i className={`fa ${kpi.icon}`} aria-hidden="true" /></span>
              </div>
              <strong className="vx-kpi-value">{pending ? "…" : kpi.value}</strong>
              <span className="vx-kpi-note">{kpi.note}</span>
            </div>
          ))}
        </div>

        <section className="vx-card vx-chart-card">
          <div className="vx-chart-head">
            <div>
              <span className="vx-eyebrow-dot">{t("admin.dashboard.chartEyebrow")}</span>
              <h2 className="vx-title-md">{t("admin.dashboard.chartTitle")}</h2>
            </div>
            <div className="vx-chart-legend">
              <span><i className="vx-legend-bar" /> {t("admin.dashboard.chartRevenue")}</span>
              <span><i className="vx-legend-dot" /> {t("admin.dashboard.chartOrders")}</span>
            </div>
          </div>
          {months.every((m) => !m.orders) && !pending ? (
            <p className="vx-chart-empty">{t("admin.dashboard.chartEmpty")}</p>
          ) : (
            <div className="vx-chart" role="img" aria-label={t("admin.dashboard.chartTitle")}>
              {months.map((m) => (
                <div key={m.start.toISOString()} className="vx-chart-col">
                  <span className="vx-chart-value">{formatPrice(m.revenue)}</span>
                  <div className="vx-chart-track">
                    <span className="vx-chart-bar" style={{ height: `${(m.revenue / maxRevenue) * 100}%` }} />
                  </div>
                  <span className="vx-chart-orders"><i className="vx-legend-dot" /> {m.orders}</span>
                  <span className="vx-chart-month">{m.start.toLocaleDateString(i18n.language, { month: "short" })}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="vx-dash-grid">
          <section className="vx-card vx-dash-table">
            <div className="vx-dash-table-head">
              <div>
                <h2 className="vx-title-sm">{t("admin.dashboard.recentTitle")}</h2>
                <p className="vx-muted">{t("admin.dashboard.recentText")}</p>
              </div>
              <Link to="/admin/orders" className="vx-btn vx-btn--soft">{t("admin.dashboard.viewAll")}</Link>
            </div>
            {recent.length === 0 ? (
              <p className="vx-chart-empty">{pending ? "…" : t("admin.dashboard.noOrders")}</p>
            ) : (
              <div className="vx-table-wrap">
                <table className="vx-table">
                  <thead>
                    <tr>
                      <th>{t("admin.dashboard.order")}</th>
                      <th>{t("admin.dashboard.customer")}</th>
                      <th>{t("admin.dashboard.items")}</th>
                      <th>{t("admin.dashboard.amount")}</th>
                      <th>{t("admin.dashboard.status")}</th>
                      <th><span className="vx-sr-only">{t("admin.dashboard.open")}</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((order) => (
                      <tr key={order._id}>
                        <td className="vx-mono">#{order._id.slice(-8).toUpperCase()}</td>
                        <td>
                          <span className="vx-cell-main">{order.user?.name || "—"}</span>
                          <span className="vx-cell-sub">{order.user?.email || order.shippingInfo?.city}</span>
                        </td>
                        <td>
                          <span className="vx-thumbs">
                            {order.orderItems.slice(0, 3).map((item) => (
                              <img key={item.product} src={item.image} alt="" />
                            ))}
                            <span className="vx-cell-sub">{t("admin.dashboard.itemsCount", { count: order.orderItems.reduce((s, i) => s + i.quantity, 0) })}</span>
                          </span>
                        </td>
                        <td className="vx-cell-main">{formatPrice(order.totalPrice)}</td>
                        <td>
                          <span className={`vx-status is-${String(order.orderStatus).toLowerCase()}`}>
                            {t(`admin.dashboard.statuses.${order.orderStatus}`, order.orderStatus)}
                          </span>
                        </td>
                        <td>
                          <Link to={`/admin/order/${order._id}`} className="vx-edit-link">{t("admin.dashboard.open")}</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="vx-card vx-dash-stock">
            <h2 className="vx-title-sm">{t("admin.dashboard.stockTitle")}</h2>
            <p className="vx-muted">{t("admin.dashboard.stockText")}</p>
            {stockList.length === 0 ? (
              <p className="vx-chart-empty">{pending ? "…" : t("admin.dashboard.noLowStock")}</p>
            ) : (
              <ul>
                {stockList.map((product) => (
                  <li key={product._id}>
                    <img src={product.image} alt="" />
                    <span className="vx-stock-info">
                      <span className="vx-cell-main">{product.name}</span>
                      <span className={`vx-stock-pill${product.stock === 0 ? " is-out" : ""}`}>
                        {product.stock === 0 ? t("admin.dashboard.outLabel") : t("admin.dashboard.left", { count: product.stock })}
                      </span>
                    </span>
                    <Link to={`/admin/product/${product._id}`} className="vx-edit-link">{t("admin.dashboard.edit")}</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </AdminLayout>
    </Fragment>
  );
};

export default Dashboard;
