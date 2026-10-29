import React from "react";
import { useTranslation } from "react-i18next";
export default function Pagination({
  activePage,
  itemsCountPerPage,
  totalItemsCount,
  onChange,
  disabled = false,
}) {
  const { t } = useTranslation(); // UPDATED: translated labels
  const pages = Math.ceil(totalItemsCount / itemsCountPerPage);
  if (pages < 2) return null;
  return (
    <nav
      aria-label={t("pagination.label")}
      className="pagination-controls d-flex align-items-center justify-content-center my-4"
    >
      <button
        type="button"
        className="btn btn-outline-secondary"
        disabled={disabled || activePage <= 1}
        onClick={() => onChange(activePage - 1)}
      >
        {t("pagination.previous")}
      </button>
      <span className="mx-3" aria-live="polite">
        {t("pagination.pageOf", { page: activePage, pages })}
      </span>
      <button
        type="button"
        className="btn btn-outline-secondary"
        disabled={disabled || activePage >= pages}
        onClick={() => onChange(activePage + 1)}
      >
        {t("pagination.next")}
      </button>
    </nav>
  );
}
