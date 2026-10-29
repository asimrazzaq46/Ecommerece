import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PRODUCT_CATEGORIES } from "../../constants/productCategories";
import { isAuthPath } from "./Header";
import "./Footer.css";

// UPDATED: Veyra footer from the Stitch storefront design (links point to real routes only).
const Footer = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  if (isAuthPath(pathname)) return null;

  return (
    <footer className="vx-footer">
      <div className="vx-container">
        <div className="vx-footer-grid">
          <div className="vx-footer-brand">
            <Link to="/" className="vx-logo">
              Veyra
            </Link>
            <p>{t("footer.about")}</p>
          </div>
          <div>
            <h2 className="vx-footer-title">{t("footer.shop")}</h2>
            <ul>
              {PRODUCT_CATEGORIES.slice(0, 6).map((category) => (
                <li key={category}>
                  <Link to={`/?category=${encodeURIComponent(category)}`}>{t(`categories.${category}`)}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="vx-footer-title">{t("footer.account")}</h2>
            <ul>
              <li><Link to="/orders/me">{t("nav.orders")}</Link></li>
              <li><Link to="/me">{t("nav.profile")}</Link></li>
              <li><Link to="/cart">{t("nav.cart")}</Link></li>
              <li><Link to="/login">{t("nav.login")}</Link></li>
            </ul>
          </div>
        </div>
        <div className="vx-footer-bottom">
          <p>{t("footer.rights", { year: new Date().getFullYear() })}</p>
          <div className="vx-footer-pay">
            <span>{t("footer.payments")}</span>
            <span className="vx-pay-badge">Visa</span>
            <span className="vx-pay-badge">Mastercard</span>
            <span className="vx-pay-badge">Stripe</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
