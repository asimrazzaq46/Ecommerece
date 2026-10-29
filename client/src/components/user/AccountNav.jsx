// UPDATED: account side navigation shared by My Profile and Edit Profile (Stitch account sidebar).
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useAlert } from "../ui/Alerts";
import { logout } from "../../actions";

const LINKS = [
  { to: "/me", icon: "fa-user-o", key: "profile", end: true },
  { to: "/orders/me", icon: "fa-file-text-o", key: "orders" },
  { to: "/password/update", icon: "fa-lock", key: "password" },
  { to: "/me#address", icon: "fa-map-marker", key: "address" },
];

export default function AccountNav({ ordersCount }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const alert = useAlert();
  const signOut = async () => {
    if (await dispatch(logout())) {
      alert.success(t("nav.logoutSuccess"));
      navigate("/");
    } else alert.error(t("nav.logoutError"));
  };
  return (
    <nav className="vx-card vx-account-nav" aria-label={t("account.nav.title")}>
      <span className="vx-label vx-account-nav-title">{t("account.nav.title")}</span>
      {LINKS.map((link) => (
        <NavLink
          key={link.key}
          to={link.to}
          end={link.end}
          className={({ isActive }) => (isActive && !link.to.includes("#") ? "is-active" : "")}
        >
          <span>
            <i className={`fa ${link.icon}`} aria-hidden="true" /> {t(`account.nav.${link.key}`)}
          </span>
          {link.key === "orders" && ordersCount > 0 ? <span className="vx-account-count">{ordersCount}</span> : <i className="fa fa-angle-right" aria-hidden="true" />}
        </NavLink>
      ))}
      <hr />
      <button type="button" className="vx-account-logout" onClick={signOut}>
        <i className="fa fa-sign-out" aria-hidden="true" /> {t("account.nav.logout")}
      </button>
    </nav>
  );
}
