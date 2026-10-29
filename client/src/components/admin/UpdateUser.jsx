import { useNavigate, useParams, Link } from "react-router-dom";
import React, { Fragment, useState, useEffect } from "react";
import { useAlert } from "../ui/Alerts";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import MetaDAta from "../layouts/MetaDAta";
import AdminLayout from "./AdminLayout";
import AdminHead from "./AdminHead";
import { emailError } from "../user/AuthFields";
import { formatPrice, translateServerError } from "../../i18n";
import { updateUser, getUserDetails, allOrders, clearError } from "../../actions";
import { UPDATE_USER_RESET } from "../../constants/userConstants";
import "../cart/Checkout.css"; // .vx-control, .vx-field-* form primitives
import "./ProductAdmin.css";

// UPDATED: Veyra "edit user" (Stitch edit user permissions): name, email and role of a user.
const UpdateUser = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { t, i18n } = useTranslation();

  const [form, setForm] = useState({ name: "", email: "", role: "user" });
  const [errors, setErrors] = useState({});

  const { error, loading, isUpdated } = useSelector((state) => state.user);
  const { user, error: detailsError } = useSelector((state) => state.userDetails);
  const { orders = [] } = useSelector((state) => state.allOrders);
  const me = useSelector((state) => state.auth.user);

  const userId = params.id;
  const loaded = user && user._id === userId;
  const isMe = me && String(me._id) === String(userId);

  const alert = useAlert();
  const dispatch = useDispatch();

  // UPDATED: always load fresh details; the old check showed stale values after an edit
  useEffect(() => {
    dispatch(getUserDetails(userId));
    dispatch(allOrders());
  }, [dispatch, userId]);

  useEffect(() => {
    if (loaded) setForm({ name: user.name, email: user.email, role: user.role });
  }, [loaded, user]);

  useEffect(() => {
    if (error || detailsError) {
      alert.error(translateServerError(t, error || detailsError));
      dispatch(clearError());
    }
    if (isUpdated) {
      alert.success(t("adminUsers.form.saved"));
      navigate("/admin/users");
      dispatch({ type: UPDATE_USER_RESET });
    }
  }, [dispatch, alert, error, detailsError, isUpdated, navigate, t]);

  const set = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));

  const submitHandler = (e) => {
    e.preventDefault();
    const next = {
      name: !form.name.trim() ? "validation.nameRequired" : form.name.length > 30 ? "validation.nameTooLong" : undefined,
      email: emailError(form.email),
    };
    setErrors(next);
    if (next.name || next.email) return;
    const formData = new FormData();
    formData.set("name", form.name);
    formData.set("email", form.email);
    formData.set("role", form.role);
    dispatch(updateUser(user._id, formData));
  };

  const mine = orders.filter((o) => o.user?._id === userId);
  const spent = mine.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);

  if (!loaded)
    return (
      <AdminLayout title={t("adminUsers.form.pageTitle")}>
        {detailsError ? (
          <div className="vx-card vx-state" role="alert">
            <span className="vx-state-icon"><i className="fa fa-exclamation-triangle" aria-hidden="true" /></span>
            <p>{t("adminUsers.form.loadError")}</p>
            <button type="button" className="vx-btn vx-btn--primary" onClick={() => dispatch(getUserDetails(userId))}>{t("adminUsers.form.retry")}</button>{" "}
            <Link to="/admin/users" className="vx-btn vx-btn--soft">{t("adminUsers.form.back")}</Link>
          </div>
        ) : (
          <p className="vx-chart-empty" role="status">…</p>
        )}
      </AdminLayout>
    );

  return (
    <Fragment>
      <MetaDAta title={t("adminUsers.form.pageTitle")} />
      <AdminLayout title={t("adminUsers.form.pageTitle")}>
        <AdminHead
          crumbs={[{ label: t("adminUsers.form.crumbUsers"), to: "/admin/users" }, { label: t("adminUsers.form.crumbEdit") }]}
          title={t("adminUsers.form.title", { name: user.name })}
          subtitle={t("adminUsers.form.subtitle")}
        />

        <form className="vx-pf" onSubmit={submitHandler} noValidate>
          <div className="vx-pf-main">
            <section className="vx-card vx-pf-card">
              <div className="vx-user-head">
                <img className="vx-user-avatar vx-user-avatar--lg" src={user.avatar?.url || "/images/default_avatar.jpg"} alt="" />
                <div>
                  <h2 className="vx-title-sm">{t("adminUsers.form.identityTitle")}</h2>
                  <p className="vx-muted">{t("adminUsers.form.identityText")}</p>
                </div>
              </div>
              <div className="vx-form-row vx-pf-fields">
                <div className="vx-field">
                  <label htmlFor="name_field" className="vx-field-label">{t("adminUsers.form.name")}</label>
                  <input id="name_field" type="text" className="vx-control" maxLength={30} value={form.name} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name_field_error" : undefined} onChange={set("name")} />
                  {errors.name && <p id="name_field_error" className="vx-field-error" role="alert">{t(errors.name)}</p>}
                </div>
                <div className="vx-field">
                  <label htmlFor="email_field" className="vx-field-label">{t("adminUsers.form.email")}</label>
                  <input id="email_field" type="email" className="vx-control" value={form.email} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email_field_error" : undefined} onChange={set("email")} />
                  {errors.email && <p id="email_field_error" className="vx-field-error" role="alert">{t(errors.email)}</p>}
                </div>
              </div>
            </section>

            <section className="vx-card vx-pf-card">
              <h2 className="vx-title-sm">{t("adminUsers.form.accessTitle")}</h2>
              <p className="vx-muted">{t("adminUsers.form.accessText")}</p>
              <div className="vx-pf-fields">
                <div className="vx-field">
                  <label htmlFor="role_field" className="vx-field-label">{t("adminUsers.form.role")}</label>
                  <select id="role_field" className="vx-control" value={form.role} disabled={isMe} aria-describedby="role_help" onChange={set("role")}>
                    <option value="user">{t("adminUsers.roles.user")}</option>
                    <option value="admin">{t("adminUsers.roles.admin")}</option>
                  </select>
                  <p id="role_help" className="vx-field-hint">{isMe ? t("adminUsers.form.selfNote") : t(form.role === "admin" ? "adminUsers.form.roleHelpAdmin" : "adminUsers.form.roleHelpUser")}</p>
                </div>
              </div>
            </section>
          </div>

          <aside className="vx-pf-side">
            <section className="vx-card vx-pf-card">
              <h2 className="vx-title-sm">{t("adminUsers.form.summaryTitle")}</h2>
              <dl className="vx-detail-facts">
                <div><dt>{t("adminUsers.form.memberSince")}</dt><dd>{new Date(user.createdAt).toLocaleDateString(i18n.language, { dateStyle: "medium" })}</dd></div>
                <div><dt>{t("adminUsers.form.orders")}</dt><dd>{mine.length}</dd></div>
                <div><dt>{t("adminUsers.form.spent")}</dt><dd>{formatPrice(spent)}</dd></div>
                <div><dt>{t("adminUsers.form.userId")}</dt><dd className="vx-mono">{user._id.slice(-8).toUpperCase()}</dd></div>
              </dl>
            </section>
            <div className="vx-pf-actions">
              <Link to="/admin/users" className="vx-btn vx-btn--soft">{t("adminUsers.form.discard")}</Link>
              <button type="submit" className="vx-btn vx-btn--primary vx-btn--caps" disabled={loading ? true : false}>
                <i className="fa fa-floppy-o" aria-hidden="true" /> {t(loading ? "adminUsers.form.saving" : "adminUsers.form.save")}
              </button>
            </div>
          </aside>
        </form>
      </AdminLayout>
    </Fragment>
  );
};

export default UpdateUser;
