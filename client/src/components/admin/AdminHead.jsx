// UPDATED: shared admin page header (breadcrumb + title + subtitle + optional action) for the redesigned admin pages.
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function AdminHead({ crumbs = [], title, subtitle, children }) {
  const { t } = useTranslation();
  return (
    <div className="vx-dash-head">
      <div>
        <nav className="vx-breadcrumb vx-admin-crumb" aria-label="Breadcrumb">
          <Link to="/dashboard">{t("adminProducts.list.crumbAdmin")}</Link>
          {crumbs.map((crumb) => (
            <React.Fragment key={crumb.label}>
              <span aria-hidden="true">/</span>
              {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span>{crumb.label}</span>}
            </React.Fragment>
          ))}
        </nav>
        <h1 className="vx-title-xl">{title}</h1>
        {subtitle && <p className="vx-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// Small stat tile used above the admin lists.
export function Kpi({ label, value, icon, note }) {
  return (
    <div className="vx-card vx-kpi">
      <div className="vx-kpi-top">
        <span className="vx-kpi-label">{label}</span>
        <span className="vx-kpi-icon"><i className={`fa ${icon}`} aria-hidden="true" /></span>
      </div>
      <strong className="vx-kpi-value">{value}</strong>
      {note && <span className="vx-kpi-note">{note}</span>}
    </div>
  );
}
