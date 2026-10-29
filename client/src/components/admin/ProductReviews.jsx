import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useAlert } from "../ui/Alerts";
import ConfirmDialog from "../ui/ConfirmDialog";
import Stars from "../ui/Stars";

import { getProductReviews, deleteReview, clearError } from "../../actions";
import { useAdminProducts, messageFor } from "../../queries/products";
import { translateServerError } from "../../i18n";
import MetaDAta from "../layouts/MetaDAta";
import AdminLayout from "./AdminLayout";
import AdminHead from "./AdminHead";

import { DELETE_REVIEW_RESET } from "../../constants/productConstants";
import "./ProductAdmin.css";

// UPDATED: Veyra product reviews (Stitch product reviews management): pick a product, see real reviews,
// rating breakdown, and delete with confirmation. Uses the existing reviews API.
const ProductReviews = () => {
  const [selected, setSelected] = useState(null); // { _id, name, rating }
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const alert = useAlert();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const productsQuery = useAdminProducts();
  const products = useMemo(() => productsQuery.data || [], [productsQuery.data]);
  const { error, reviews = [], loading } = useSelector((state) => state.productReviews);
  const { isDeleted, error: deleteError } = useSelector((state) => state.deleteReview);

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => !q || p.name.toLowerCase().includes(q) || p._id.toLowerCase().includes(q)).slice(0, 40);
  }, [products, search]);

  const choose = (product) => {
    setSelected(product);
    dispatch(getProductReviews(product._id));
  };

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
      alert.success(t("adminReviews.deleted"));
      if (selected) dispatch(getProductReviews(selected._id));
      dispatch({ type: DELETE_REVIEW_RESET });
      setDeleting(false);
      setToDelete(null);
    }
  }, [dispatch, alert, error, deleteError, isDeleted, selected, t]);

  const average = reviews.length ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length : 0;
  const share = (star) => (reviews.length ? Math.round((reviews.filter((r) => Math.round(r.rating) === star).length / reviews.length) * 100) : 0);

  return (
    <Fragment>
      <MetaDAta title={t("adminReviews.pageTitle")} />
      <AdminLayout title={t("admin.nav.reviews")}>
        <AdminHead crumbs={[{ label: t("adminReviews.pageTitle") }]} title={t("adminReviews.title")} subtitle={t("adminReviews.subtitle")} />

        <div className="vx-rv">
          <section className="vx-card vx-pf-card vx-rv-pick">
            <h2 className="vx-title-sm">{t("adminReviews.pickTitle")}</h2>
            <div className="vx-pm-search">
              <i className="fa fa-search" aria-hidden="true" />
              <input type="search" className="vx-control" aria-label={t("adminReviews.searchPlaceholder")} placeholder={t("adminReviews.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {productsQuery.error ? (
              <p className="vx-form-alert" role="alert">{messageFor(productsQuery.error)} <button type="button" className="vx-link-btn" onClick={() => productsQuery.refetch()}>{t("adminReviews.retry")}</button></p>
            ) : productsQuery.isPending ? (
              <p className="vx-chart-empty" role="status">…</p>
            ) : visibleProducts.length === 0 ? (
              <p className="vx-chart-empty">{t("adminReviews.noProducts")}</p>
            ) : (
              <ul className="vx-rv-list">
                {visibleProducts.map((product) => (
                  <li key={product._id}>
                    <button type="button" aria-pressed={selected?._id === product._id} className={selected?._id === product._id ? "is-active" : ""} onClick={() => choose(product)}>
                      <img src={product.images?.[0]?.url} alt="" />
                      <span>
                        <span className="vx-cell-main vx-rv-name">{product.name}</span>
                        <span className="vx-cell-sub">{t("adminReviews.reviewsCount", { count: product.NumOfReviews || 0 })}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="vx-rv-main" aria-live="polite">
            {!selected ? (
              <div className="vx-card vx-state">
                <span className="vx-state-icon"><i className="fa fa-star-o" aria-hidden="true" /></span>
                <p>{t("adminReviews.selectPrompt")}</p>
              </div>
            ) : (
              <>
                <div className="vx-card vx-pf-card vx-rv-summary">
                  <div>
                    <span className="vx-eyebrow">{t("adminReviews.forProduct")}</span>
                    <h2 className="vx-title-md">{selected.name}</h2>
                    <Link to={`/product/${selected._id}`} className="vx-edit-link">{t("adminReviews.viewProduct")}</Link>
                  </div>
                  <div className="vx-rv-score">
                    <strong>{average.toFixed(1)}</strong>
                    <span className="vx-muted">{t("adminReviews.outOf")}</span>
                    <Stars value={average} />
                    <span className="vx-label">{t("adminReviews.based", { count: reviews.length })}</span>
                  </div>
                  <div className="vx-reviews-bars">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div key={star} className="vx-reviews-bar">
                        <span>{star}★</span>
                        <span className="vx-reviews-track"><span style={{ width: `${share(star)}%` }} /></span>
                        <span className="vx-muted">{share(star)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {loading ? (
                  <p className="vx-chart-empty" role="status">…</p>
                ) : reviews.length === 0 ? (
                  <div className="vx-card vx-state"><p>{t("adminReviews.none")}</p></div>
                ) : (
                  <ul className="vx-rv-cards">
                    {reviews.map((review) => (
                      <li key={review._id} className="vx-card vx-pf-card">
                        <div className="vx-rv-card-head">
                          <div>
                            <strong className="vx-title-sm">{review.name}</strong>
                            <Stars value={review.rating} />
                          </div>
                          <button type="button" className="vx-icon-btn vx-icon-btn--danger" aria-label={t("adminReviews.deleteNamed", { name: review.name })} title={t("adminReviews.delete")} onClick={() => setToDelete(review)}>
                            <i className="fa fa-trash-o" aria-hidden="true" />
                          </button>
                        </div>
                        <p className="vx-muted vx-rv-comment">{review.comment}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>
        </div>
      </AdminLayout>

      <ConfirmDialog
        open={Boolean(toDelete)}
        busy={deleting}
        title={t("adminReviews.confirmTitle")}
        text={toDelete ? t("adminReviews.confirmText", { name: toDelete.name }) : ""}
        confirmLabel={t(deleting ? "adminReviews.deleting" : "adminReviews.confirmDelete")}
        cancelLabel={t("adminReviews.confirmCancel")}
        onConfirm={() => { setDeleting(true); dispatch(deleteReview(toDelete._id, selected._id)); }}
        onCancel={() => setToDelete(null)}
      />
    </Fragment>
  );
};

export default ProductReviews;
