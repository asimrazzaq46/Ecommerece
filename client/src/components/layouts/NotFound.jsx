// UPDATED: simple Veyra 404 page (Stitch "404 page not found"), real links only.
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MetaDAta from "./MetaDAta";
import "./NotFound.css";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <>
      <MetaDAta title={t("notFound.pageTitle")} />
      <div className="vx-page vx-notfound">
        <div className="vx-container">
          <span className="vx-notfound-code" aria-hidden="true">404</span>
          <h1 className="vx-title-xl">{t("notFound.title")}</h1>
          <p className="vx-muted">{t("notFound.text")}</p>
          <div className="vx-notfound-actions">
            <Link to="/" className="vx-btn vx-btn--primary vx-btn--caps">{t("notFound.home")}</Link>
            <Link to="/cart" className="vx-btn vx-btn--soft vx-btn--caps">{t("nav.cart")}</Link>
            <Link to="/login" className="vx-btn vx-btn--soft vx-btn--caps">{t("nav.login")}</Link>
          </div>
        </div>
      </div>
    </>
  );
}
