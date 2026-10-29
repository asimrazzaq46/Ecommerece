// UPDATED: reusable Veyra admin shell (Stitch admin dashboard): fixed sidebar, dark top bar, content area.
// Pages that use it must be matched by isAdminLayoutPath (layouts/Header.jsx) so the storefront header is hidden.
import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../layouts/LanguageSwitcher";
import "./Admin.css";

const NAV = [
  { section: "overview", links: [{ to: "/dashboard", icon: "fa-th-large", key: "dashboard" }] },
  {
    section: "catalog",
    links: [
      { to: "/admin/products", icon: "fa-cube", key: "products" },
      { to: "/admin/product", icon: "fa-plus-circle", key: "newProduct" },
    ],
  },
  { section: "sales", links: [{ to: "/admin/orders", icon: "fa-file-text-o", key: "orders" }] },
  {
    section: "community",
    links: [
      { to: "/admin/users", icon: "fa-users", key: "users" },
      { to: "/admin/reviews", icon: "fa-star-o", key: "reviews" },
    ],
  },
];

export default function AdminLayout({ title, children }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const user = useSelector((state) => state.auth.user);
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]); // close the mobile drawer after navigating
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="vx-admin">
      <aside className={`vx-admin-side${open ? " is-open" : ""}`} aria-label={t("admin.portal")}>
        <div className="vx-admin-brand">
          <span className="vx-admin-mark" aria-hidden="true">V</span>
          <div>
            <Link to="/" className="vx-admin-name">Veyra</Link>
            <span className="vx-admin-portal">{t("admin.portal")}</span>
          </div>
          <button type="button" className="vx-admin-close" aria-label={t("admin.closeMenu")} onClick={() => setOpen(false)}>
            <i className="fa fa-times" aria-hidden="true" />
          </button>
        </div>
        <nav className="vx-admin-nav">
          {NAV.map((group) => (
            <div key={group.section} className="vx-admin-group">
              <span className="vx-admin-group-title">{t(`admin.nav.${group.section}`)}</span>
              {group.links.map((link) => (
                <NavLink key={link.to} to={link.to} end className={({ isActive }) => (isActive ? "is-active" : "")}>
                  <i className={`fa ${link.icon}`} aria-hidden="true" />
                  <span>{t(`admin.nav.${link.key}`)}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="vx-admin-side-foot">
          <Link to="/" className="vx-admin-store">
            <span><i className="fa fa-shopping-bag" aria-hidden="true" /> {t("admin.nav.store")}</span>
            <i className="fa fa-external-link" aria-hidden="true" />
          </Link>
          <span className="vx-admin-copy">© {new Date().getFullYear()} Veyra</span>
        </div>
      </aside>
      {open && <div className="vx-admin-scrim" onClick={() => setOpen(false)} />}

      <div className="vx-admin-body">
        <header className="vx-admin-top">
          <button type="button" className="vx-admin-menu" aria-label={t("admin.openMenu")} aria-expanded={open} onClick={() => setOpen(true)}>
            <i className="fa fa-bars" aria-hidden="true" />
          </button>
          <span className="vx-admin-top-title">{title}</span>
          <div className="vx-admin-top-right">
            <LanguageSwitcher />
            {user && (
              <Link to="/me" className="vx-admin-user">
                <img src={user.avatar?.url || "/images/default_avatar.jpg"} alt="" />
                <span>{user.name}</span>
              </Link>
            )}
          </div>
        </header>
        <main className="vx-admin-main">{children}</main>
      </div>
    </div>
  );
}
