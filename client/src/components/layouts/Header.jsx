import React, { useState } from "react";
import { Link, NavLink, useLocation, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useAlert } from "../ui/Alerts";

import { logout } from "../../actions";
import { PRODUCT_CATEGORIES } from "../../constants/productCategories";
import LanguageSwitcher from "./LanguageSwitcher";
import Search from "./Search";
import "./Storefront.css";

// UPDATED: Login/Register/password recovery are full-screen designs without the storefront chrome.
export const isAuthPath = (pathname) =>
  ["/login", "/register", "/password/forgot"].includes(pathname) || pathname.startsWith("/password/reset/");

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const alert = useAlert();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const activeCategory = pathname === "/" ? searchParams.get("category") : null;

  const { user, loading } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.cart);

  // UPDATED: toast reflects the real logout result
  const logoutHandler = async () => {
    if (await dispatch(logout())) alert.success(t("nav.logoutSuccess"));
    else alert.error(t("nav.logoutError"));
  };

  if (isAuthPath(pathname)) return null;

  return (
    <header className="vx-header">
      <div className="vx-topbar">
        <div className="vx-container vx-topbar-inner">
          <span>
            <i className="fa fa-lock" aria-hidden="true" /> {t("nav.securePayments")}
          </span>
          <LanguageSwitcher />
        </div>
      </div>

      <nav aria-label="Main navigation" className="vx-container vx-header-main">
        <Link to="/" className="vx-logo">
          Veyra
        </Link>

        <div className="vx-header-search">
          <Search />
        </div>

        <div className="vx-header-actions">
          <Link to="/cart" className="vx-cart-link" aria-label={t("nav.cartLabel", { count: cartItems.length })}>
            <i className="fa fa-shopping-bag" aria-hidden="true" />
            {cartItems.length > 0 && (
              <span className="vx-cart-badge" aria-hidden="true">
                {cartItems.length}
              </span>
            )}
          </Link>

          {user ? (
            <div
              className="vx-account"
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setMenuOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setMenuOpen(false);
              }}
            >
              <button
                onClick={() => setMenuOpen((open) => !open)}
                className="vx-account-btn"
                type="button"
                aria-haspopup="true"
                aria-expanded={menuOpen}
                aria-label={t("nav.account")}
              >
                <img src={user.avatar && user.avatar.url} alt="" className="vx-avatar" />
                <span className="vx-account-name">{user.name}</span>
                <i className="fa fa-angle-down" aria-hidden="true" />
              </button>

              {menuOpen && (
                <div className="vx-menu" onClick={() => setMenuOpen(false)}>
                  {user.role === "admin" && <Link to="/dashboard">{t("nav.dashboard")}</Link>}
                  <Link to="/orders/me">{t("nav.orders")}</Link>
                  <Link to="/me">{t("nav.profile")}</Link>
                  <Link to="/" className="is-danger" onClick={logoutHandler}>
                    {t("nav.logout")}
                  </Link>
                </div>
              )}
            </div>
          ) : (
            !loading && (
              <div className="vx-auth-links">
                <Link to="/login" className="vx-btn vx-btn--soft">
                  {t("nav.login")}
                </Link>
                <Link to="/register" className="vx-btn vx-btn--primary vx-hide-sm">
                  {t("nav.register")}
                </Link>
              </div>
            )
          )}
        </div>
      </nav>

      <nav aria-label={t("nav.categories")} className="vx-container vx-catnav">
        {PRODUCT_CATEGORIES.map((category) => (
          <NavLink
            key={category}
            to={`/?category=${encodeURIComponent(category)}`}
            className={() => (activeCategory === category ? "is-active" : "")}
            aria-current={activeCategory === category ? "page" : undefined}
          >
            {t(`categories.${category}`)}
          </NavLink>
        ))}
      </nav>
    </header>
  );
};

export default Header;
