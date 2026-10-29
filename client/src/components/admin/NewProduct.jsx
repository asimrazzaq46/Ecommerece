import { useNavigate, Link } from "react-router-dom";
import React, { Fragment, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useAlert } from "../ui/Alerts";

import { newProduct, clearError } from "../../actions";
import { translateServerError } from "../../i18n";
import MetaDAta from "../layouts/MetaDAta";
import AdminLayout from "./AdminLayout";
import ProductForm from "./ProductForm";
import { NEW_PRODUCT_RESET } from "../../constants/productConstants";

// UPDATED: Veyra "Add product" page (Stitch create product design); the form is shared with Edit.
const NewProduct = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const alert = useAlert();
  const dispatch = useDispatch();

  const { loading, error, success } = useSelector((state) => state.newProduct);

  useEffect(() => {
    if (error) {
      alert.error(translateServerError(t, error));
      dispatch(clearError());
    }

    if (success) {
      navigate("/admin/products");
      alert.success(t("adminProducts.form.created"));
      dispatch({ type: NEW_PRODUCT_RESET });
    }
  }, [dispatch, alert, error, success, navigate, t]);

  return (
    <Fragment>
      <MetaDAta title={t("adminProducts.form.createTitle")} />
      <AdminLayout title={t("admin.nav.newProduct")}>
        <div className="vx-dash-head">
          <div>
            <nav className="vx-breadcrumb vx-admin-crumb" aria-label="Breadcrumb">
              <Link to="/dashboard">{t("adminProducts.list.crumbAdmin")}</Link>
              <span aria-hidden="true">/</span>
              <Link to="/admin/products">{t("adminProducts.list.title")}</Link>
              <span aria-hidden="true">/</span>
              <span>{t("adminProducts.form.createCrumb")}</span>
            </nav>
            <h1 className="vx-title-xl">{t("adminProducts.form.createTitle")}</h1>
            <p className="vx-muted">{t("adminProducts.form.createSubtitle")}</p>
          </div>
        </div>
        <ProductForm mode="create" loading={loading} onSubmit={(formData) => dispatch(newProduct(formData))} />
      </AdminLayout>
    </Fragment>
  );
};

export default NewProduct;
