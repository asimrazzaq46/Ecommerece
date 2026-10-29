import React, { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import axios from "axios";
import MetaDAta from "../layouts/MetaDAta";
import Loader from "../layouts/Loader";
import { useAlert } from "../ui/Alerts";
import { deleteShippingInfo } from "../../actions";
import { formatPrice, translateServerError, countryLabel } from "../../i18n";
import { messageFor } from "../../queries/products";
import AccountNav from "./AccountNav";
import "./Account.css";

// UPDATED: Veyra "My profile" (Stitch patron profile design) with real account data only.
const Profile = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const alert = useAlert();
  const { user, loading } = useSelector((state) => state.auth);
  const savedAddress = useSelector((state) => state.cart.savedShippingInfo);
  const [removing, setRemoving] = useState(false);
  // The user's own orders, used for the order count and total spent.
  const orders = useQuery({
    queryKey: ["orders", "me"],
    queryFn: async () => (await axios.get("/api/v1/order/me")).data.order,
  });

  if (loading || !user) return <Loader />;

  const list = orders.data || [];
  const spent = list.reduce(
    (sum, order) => sum + Number(order.totalPrice || 0),
    0,
  );
  const joined = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(i18n.language, {
        month: "long",
        year: "numeric",
      })
    : "—";
  const roleLabel = t(
    `account.profile.roles.${user.role === "admin" ? "admin" : "user"}`,
  );

  const removeAddress = async () => {
    setRemoving(true);
    try {
      await dispatch(deleteShippingInfo());
      alert.success(t("account.profile.addressRemoved"));
    } catch (error) {
      alert.error(translateServerError(t, messageFor(error)));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Fragment>
      <MetaDAta title={t("account.profile.pageTitle")} />
      <div className="vx-page vx-account">
        <div className="vx-container">
          <section className="vx-card vx-account-banner">
            <div className="vx-account-id">
              <img
                className="vx-account-avatar"
                src={user.avatar?.url || "/images/default_avatar.jpg"}
                alt=""
              />
              <div>
                <div className="vx-account-name-row">
                  <h1 className="vx-title-xl">{user.name}</h1>
                  <span className="vx-account-badge">
                    <i className="fa fa-star" aria-hidden="true" /> {roleLabel}
                  </span>
                </div>
                <p className="vx-account-meta">
                  <span>
                    <i className="fa fa-calendar-o" aria-hidden="true" />{" "}
                    {t("account.profile.memberSince", { date: joined })}
                  </span>
                  <span aria-hidden="true">•</span>
                  <span>{user.email}</span>
                </p>
              </div>
            </div>
            <dl className="vx-account-stats">
              <div>
                <dt>{t("account.profile.stats.orders")}</dt>
                <dd>
                  {orders.isPending ? "…" : orders.isError ? "—" : list.length}
                </dd>
              </div>
              <div>
                <dt>{t("account.profile.stats.spent")}</dt>
                <dd>
                  {orders.isPending
                    ? "…"
                    : orders.isError
                      ? "—"
                      : formatPrice(spent)}
                </dd>
              </div>
              <div>
                <dt>{t("account.profile.stats.address")}</dt>
                <dd>
                  {savedAddress
                    ? t("account.profile.stats.saved")
                    : t("account.profile.stats.none")}
                </dd>
              </div>
            </dl>
          </section>

          {orders.isError && (
            <p className="vx-form-alert vx-account-alert" role="alert">
              {t("account.profile.loadError")}{" "}
              <button
                type="button"
                className="vx-link-btn"
                onClick={() => orders.refetch()}
              >
                {t("admin.dashboard.retry")}
              </button>
            </p>
          )}

          <div className="vx-account-grid">
            <AccountNav ordersCount={list.length} />

            <div className="vx-account-main">
              <section className="vx-card vx-account-section">
                <div className="vx-account-section-head">
                  <div>
                    <span className="vx-eyebrow">
                      {t("account.profile.infoEyebrow")}
                    </span>
                    <h2 className="vx-title-md">
                      {t("account.profile.infoTitle")}
                    </h2>
                    <p className="vx-muted">{t("account.profile.infoText")}</p>
                  </div>
                  <Link to="/me/update" className="vx-btn vx-btn--primary">
                    <i className="fa fa-pencil" aria-hidden="true" />{" "}
                    {t("account.profile.edit")}
                  </Link>
                </div>
                <dl className="vx-account-fields">
                  <div>
                    <dt>{t("account.profile.name")}</dt>
                    <dd>{user.name}</dd>
                  </div>
                  <div>
                    <dt>{t("account.profile.email")}</dt>
                    <dd>{user.email}</dd>
                  </div>
                  <div>
                    <dt>{t("account.profile.role")}</dt>
                    <dd>{roleLabel}</dd>
                  </div>
                  <div>
                    <dt>{t("account.profile.joined")}</dt>
                    <dd>{joined}</dd>
                  </div>
                </dl>
              </section>

              <section className="vx-card vx-account-section" id="address">
                <span className="vx-eyebrow">
                  {t("account.profile.addressEyebrow")}
                </span>
                <h2 className="vx-title-md">
                  {t("account.profile.addressTitle")}
                </h2>
                <p className="vx-muted">{t("account.profile.addressText")}</p>
                {savedAddress ? (
                  <div className="vx-account-address">
                    <p>
                      <strong>{user.name}</strong>
                      <br />
                      {savedAddress.address}
                      <br />
                      {savedAddress.postalCode} {savedAddress.city},{" "}
                      {countryLabel(savedAddress.country)}
                      <br />
                      {savedAddress.phoneNo}
                    </p>
                    <button
                      type="button"
                      className="vx-btn vx-btn--soft"
                      disabled={removing}
                      onClick={removeAddress}
                    >
                      <i className="fa fa-trash-o" aria-hidden="true" />{" "}
                      {t("account.profile.removeAddress")}
                    </button>
                  </div>
                ) : (
                  <p className="vx-account-empty">
                    {t("account.profile.noAddress")}
                  </p>
                )}
              </section>

              <div className="vx-account-cards">
                <section className="vx-card vx-account-section">
                  <span className="vx-eyebrow">
                    {t("account.profile.securityEyebrow")}
                  </span>
                  <h2 className="vx-title-sm">
                    {t("account.profile.securityTitle")}
                  </h2>
                  <p className="vx-muted">
                    {t("account.profile.securityText")}
                  </p>
                  <Link to="/password/update" className="vx-btn vx-btn--soft">
                    <i className="fa fa-key" aria-hidden="true" />{" "}
                    {t("account.profile.changePassword")}
                  </Link>
                </section>
                <section className="vx-card vx-account-section">
                  <span className="vx-eyebrow">
                    {t("account.profile.ordersTitle")}
                  </span>
                  <h2 className="vx-title-sm">{t("account.nav.orders")}</h2>
                  <p className="vx-muted">{t("account.profile.ordersText")}</p>
                  <Link to="/orders/me" className="vx-btn vx-btn--soft">
                    <i className="fa fa-file-text-o" aria-hidden="true" />{" "}
                    {t("account.profile.viewOrders")}
                  </Link>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default Profile;
