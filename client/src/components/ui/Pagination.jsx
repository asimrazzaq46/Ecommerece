import React from "react";
export default function Pagination({
  activePage,
  itemsCountPerPage,
  totalItemsCount,
  onChange,
  disabled = false,
}) {
  const pages = Math.ceil(totalItemsCount / itemsCountPerPage);
  if (pages < 2) return null;
  return (
    <nav
      aria-label="Pagination"
      className="pagination-controls d-flex align-items-center justify-content-center my-4"
    >
      <button
        type="button"
        className="btn btn-outline-secondary"
        disabled={disabled || activePage <= 1}
        onClick={() => onChange(activePage - 1)}
      >
        Previous
      </button>
      <span className="mx-3" aria-live="polite">
        Page {activePage} of {pages}
      </span>
      <button
        type="button"
        className="btn btn-outline-secondary"
        disabled={disabled || activePage >= pages}
        onClick={() => onChange(activePage + 1)}
      >
        Next
      </button>
    </nav>
  );
}
