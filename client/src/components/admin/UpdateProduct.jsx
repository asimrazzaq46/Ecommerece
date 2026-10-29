import { useNavigate, useParams, Link } from "react-router-dom";
import React, { Fragment, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useAlert } from "../ui/Alerts";

import { updateProduct, clearError } from "../../actions";
import { useProduct, messageFor } from "../../queries/products";
import { translateServerError } from "../../i18n";
import MetaDAta from "../layouts/MetaDAta";
import AdminLayout from "./AdminLayout";
import ProductForm from "./ProductForm";
import { UPDATE_PRODUCT_RESET } from "../../constants/productConstants";

// UPDATED: Veyra "Edit product" page (Stitch edit product design); prefilled shared form.
const UpdateProduct = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { t } = useTranslation();

  const alert = useAlert();
  const dispatch = useDispatch();

  const query = useProduct(params.id);
  const product = query.data;
  const error = query.error ? messageFor(query.error) : null;

  const { error: updateError, loading, isUpdated } = useSelector((state) => state.product);

  useEffect(() => {
    if (updateError) {
      alert.error(translateServerError(t, updateError));
      dispatch(clearError());
    }

    if (isUpdated) {
      navigate("/admin/products");
      alert.success(t("adminProducts.form.updated"));
      dispatch({ type: UPDATE_PRODUCT_RESET });
    }
  }, [dispatch, alert, updateError, isUpdated, navigate, t]);

  return (
    <Fragment>
      <MetaDAta title={t("adminProducts.form.editTitle")} />
      <AdminLayout title={t("adminProducts.form.editCrumb")}>
        <div className="vx-dash-head">
          <div>
            <nav className="vx-breadcrumb vx-admin-crumb" aria-label="Breadcrumb">
              <Link to="/dashboard">{t("adminProducts.list.crumbAdmin")}</Link>
              <span aria-hidden="true">/</span>
              <Link to="/admin/products">{t("adminProducts.list.title")}</Link>
              <span aria-hidden="true">/</span>
              <span>{t("adminProducts.form.editCrumb")}</span>
            </nav>
            <h1 className="vx-title-xl">{t("adminProducts.form.editTitle")}</h1>
            <p className="vx-muted">{t("adminProducts.form.editSubtitle")}</p>
          </div>
        </div>
        {query.isPending ? (
          <p className="vx-chart-empty" role="status">{t("adminProducts.form.loading")}</p>
        ) : error ? (
          <div className="vx-card vx-state" role="alert">
            <span className="vx-state-icon"><i className="fa fa-exclamation-triangle" aria-hidden="true" /></span>
            <p>{t("adminProducts.form.loadError")} ({translateServerError(t, error)})</p>
            <button type="button" className="vx-btn vx-btn--primary" onClick={() => query.refetch()}>{t("adminProducts.form.retry")}</button>{" "}
            <Link to="/admin/products" className="vx-btn vx-btn--soft">{t("adminProducts.form.back")}</Link>
          </div>
        ) : (
          <ProductForm
            key={product._id}
            mode="edit"
            initial={product}
            existingImages={product.images || []}
            loading={loading}
            onSubmit={(formData) => dispatch(updateProduct(product._id, formData))}
          />
        )}
      </AdminLayout>
    </Fragment>
  );
};

export default UpdateProduct;
