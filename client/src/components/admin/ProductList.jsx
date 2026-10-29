import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useAlert } from "../ui/Alerts";
import Pagination from "../ui/Pagination";
import ConfirmDialog from "../ui/ConfirmDialog";
import Stars from "../ui/Stars";

import { deleteProduct, clearError } from "../../actions";
import { useAdminProducts, messageFor } from "../../queries/products";
import { PRODUCT_CATEGORIES } from "../../constants/productCategories";
import { formatPrice, translateServerError } from "../../i18n";
import MetaDAta from "../layouts/MetaDAta";
import AdminLayout from "./AdminLayout";
import { DELETE_PRODUCT_RESET } from "../../constants/productConstants";
import "./ProductAdmin.css";

const LOW_STOCK = 5;
const PAGE_SIZE = 10;
const TABS = ["all", "in", "low", "out"];
const SORTS = ["newest", "priceHigh", "priceLow", "stockLow", "name"];

const stockKind = (stock) => (stock === 0 ? "out" : stock <= LOW_STOCK ? "low" : "in");

// UPDATED: Veyra product management (Stitch design): status tabs, search, category + sort, table, pagination,
// and an accessible delete confirmation. Works on the existing admin products query.
const ProductList = () => {
  const alert = useAlert();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const query = useAdminProducts();
  const products = useMemo(() => query.data || [], [query.data]);
  const error = query.error ? messageFor(query.error) : null;
  const { error: deleteError, isDeleted } = useSelector((state) => state.product);

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (deleteError) {
      alert.error(translateServerError(t, deleteError));
      dispatch(clearError());
      setDeleting(false);
    }
    if (isDeleted) {
      alert.success(t("adminProducts.list.deleted"));
      dispatch({ type: DELETE_PRODUCT_RESET });
      setDeleting(false);
      setToDelete(null);
    }
  }, [dispatch, alert, deleteError, isDeleted, t]);

  const counts = useMemo(
    () => ({
      all: products.length,
      in: products.filter((p) => stockKind(p.stock) === "in").length,
      low: products.filter((p) => stockKind(p.stock) === "low").length,
      out: products.filter((p) => stockKind(p.stock) === "out").length,
    }),
    [products],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => tab === "all" || stockKind(p.stock) === tab)
      .filter((p) => !category || p.catagory === category)
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p._id.toLowerCase().includes(q))
      .sort((a, b) =>
        sort === "priceHigh" ? b.price - a.price
        : sort === "priceLow" ? a.price - b.price
        : sort === "stockLow" ? a.stock - b.stock
        : sort === "name" ? a.name.localeCompare(b.name)
        : new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );
  }, [products, tab, search, category, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const filtered = tab !== "all" || search.trim() !== "" || category !== "";
  const reset = (setter) => (value) => {
    setter(value);
    setPage(1);
  };
  const clearFilters = () => {
    setTab("all");
    setSearch("");
    setCategory("");
    setPage(1);
  };

  const confirmDelete = () => {
    setDeleting(true);
    dispatch(deleteProduct(toDelete._id));
  };

  return (
    <Fragment>
      <MetaDAta title={t("adminProducts.list.pageTitle")} />
      <AdminLayout title={t("admin.nav.products")}>
        <div className="vx-dash-head">
          <div>
            <nav className="vx-breadcrumb vx-admin-crumb" aria-label="Breadcrumb">
              <Link to="/dashboard">{t("adminProducts.list.crumbAdmin")}</Link>
              <span aria-hidden="true">/</span>
              <span>{t("adminProducts.list.title")}</span>
            </nav>
            <div className="vx-pm-title">
              <h1 className="vx-title-xl">{t("adminProducts.list.title")}</h1>
              {!query.isPending && (
                <span className="vx-pm-count">
                  {t("adminProducts.list.count", { count: products.length })}
                  {counts.out > 0 && <span className="vx-pm-out"> • {t("adminProducts.list.outCount", { count: counts.out })}</span>}
                </span>
              )}
            </div>
          </div>
          <Link to="/admin/product" className="vx-btn vx-btn--primary vx-btn--caps">
            <i className="fa fa-plus" aria-hidden="true" /> {t("adminProducts.list.newProduct")}
          </Link>
        </div>

        <section className="vx-card vx-pm-card">
          <div className="vx-pm-tools">
            <div className="vx-pm-tabs" role="group" aria-label={t("adminProducts.list.stock")}>
              {TABS.map((key) => (
                <button key={key} type="button" aria-pressed={tab === key} className={tab === key ? "is-active" : ""} onClick={() => reset(setTab)(key)}>
                  {t(`adminProducts.list.tab${key[0].toUpperCase()}${key.slice(1)}`)} <span>{counts[key]}</span>
                </button>
              ))}
            </div>
            <div className="vx-pm-filters">
              <div className="vx-pm-search">
                <i className="fa fa-search" aria-hidden="true" />
                <input
                  type="search"
                  className="vx-control"
                  aria-label={t("adminProducts.list.searchPlaceholder")}
                  placeholder={t("adminProducts.list.searchPlaceholder")}
                  value={search}
                  onChange={(e) => reset(setSearch)(e.target.value)}
                />
              </div>
              <select className="vx-control" aria-label={t("adminProducts.list.category")} value={category} onChange={(e) => reset(setCategory)(e.target.value)}>
                <option value="">{t("adminProducts.list.allCategories")}</option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{t(`categories.${c}`)}</option>
                ))}
              </select>
              <select className="vx-control" aria-label={t("adminProducts.list.sortLabel")} value={sort} onChange={(e) => reset(setSort)(e.target.value)}>
                {SORTS.map((key) => (
                  <option key={key} value={key}>{t(`adminProducts.list.sort.${key}`)}</option>
                ))}
              </select>
            </div>
          </div>

          {error ? (
            <div className="vx-state" role="alert">
              <span className="vx-state-icon"><i className="fa fa-exclamation-triangle" aria-hidden="true" /></span>
              <p>{t("adminProducts.list.loadError")} ({error})</p>
              <button type="button" className="vx-btn vx-btn--primary" onClick={() => query.refetch()}>{t("adminProducts.list.retry")}</button>
            </div>
          ) : query.isPending ? (
            <p className="vx-chart-empty" role="status">…</p>
          ) : products.length === 0 ? (
            <div className="vx-state">
              <span className="vx-state-icon"><i className="fa fa-cube" aria-hidden="true" /></span>
              <h2 className="vx-title-md">{t("adminProducts.list.emptyTitle")}</h2>
              <p>{t("adminProducts.list.emptyText")}</p>
              <Link to="/admin/product" className="vx-btn vx-btn--primary">{t("adminProducts.list.newProduct")}</Link>
            </div>
          ) : rows.length === 0 ? (
            <div className="vx-state">
              <span className="vx-state-icon"><i className="fa fa-search" aria-hidden="true" /></span>
              <p>{t("adminProducts.list.noMatch")}</p>
              {filtered && <button type="button" className="vx-btn vx-btn--soft" onClick={clearFilters}>{t("adminProducts.list.clearFilters")}</button>}
            </div>
          ) : (
            <>
              <div className="vx-table-wrap">
                <table className="vx-table vx-pm-table">
                  <thead>
                    <tr>
                      <th>{t("adminProducts.list.product")}</th>
                      <th>{t("adminProducts.list.category")}</th>
                      <th>{t("adminProducts.list.price")}</th>
                      <th>{t("adminProducts.list.stock")}</th>
                      <th>{t("adminProducts.list.rating")}</th>
                      <th><span className="vx-sr-only">{t("adminProducts.list.actions")}</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((product) => {
                      const kind = stockKind(product.stock);
                      return (
                        <tr key={product._id}>
                          <td>
                            <span className="vx-pm-product">
                              <img src={product.images?.[0]?.url} alt="" />
                              <span>
                                <Link to={`/product/${product._id}`} className="vx-cell-main vx-pm-name">{product.name}</Link>
                                <span className="vx-cell-sub vx-mono">#{product._id.slice(-8).toUpperCase()}</span>
                              </span>
                            </span>
                          </td>
                          <td>{t(`categories.${product.catagory}`, product.catagory)}</td>
                          <td className="vx-cell-main">{formatPrice(product.price)}</td>
                          <td>
                            <span className={`vx-stock-pill is-${kind}`}>
                              {kind === "out" ? t("adminProducts.list.out") : kind === "low" ? t("adminProducts.list.low", { count: product.stock }) : t("adminProducts.list.inStock", { count: product.stock })}
                            </span>
                          </td>
                          <td>
                            {product.NumOfReviews > 0 ? (
                              <span className="vx-pm-rating"><Stars value={product.rating} /> <span className="vx-cell-sub">{t("adminProducts.list.reviews", { count: product.NumOfReviews })}</span></span>
                            ) : (
                              <span className="vx-cell-sub">{t("adminProducts.list.noRating")}</span>
                            )}
                          </td>
                          <td>
                            <span className="vx-pm-actions">
                              <Link to={`/admin/product/${product._id}`} className="vx-icon-btn" aria-label={t("adminProducts.list.editNamed", { name: product.name })} title={t("adminProducts.list.edit")}>
                                <i className="fa fa-pencil" aria-hidden="true" />
                              </Link>
                              <button type="button" className="vx-icon-btn vx-icon-btn--danger" aria-label={t("adminProducts.list.deleteNamed", { name: product.name })} title={t("adminProducts.list.delete")} onClick={() => setToDelete(product)}>
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
                <span className="vx-muted">
                  {t("adminProducts.list.showing", { from: (current - 1) * PAGE_SIZE + 1, to: Math.min(current * PAGE_SIZE, rows.length), total: rows.length })}
                </span>
                <Pagination activePage={current} itemsCountPerPage={PAGE_SIZE} totalItemsCount={rows.length} onChange={setPage} />
              </div>
            </>
          )}
        </section>
      </AdminLayout>

      <ConfirmDialog
        open={Boolean(toDelete)}
        busy={deleting}
        title={t("adminProducts.list.confirmTitle")}
        text={toDelete ? t("adminProducts.list.confirmText", { name: toDelete.name }) : ""}
        confirmLabel={t(deleting ? "adminProducts.list.deleting" : "adminProducts.list.confirmDelete")}
        cancelLabel={t("adminProducts.list.confirmCancel")}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </Fragment>
  );
};

export default ProductList;
