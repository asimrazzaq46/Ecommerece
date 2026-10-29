// UPDATED: read-only star rating (Font Awesome), shared by cards, details and reviews.
import React from "react";
import { useTranslation } from "react-i18next";

export default function Stars({ value = 0, className = "" }) {
  const { t } = useTranslation();
  const rating = Number(value) || 0;
  return (
    <span
      className={`vx-stars ${className}`}
      role="img"
      aria-label={t("product.ratingLabel", { value: rating.toFixed(1) })}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <i
          key={n}
          aria-hidden="true"
          className={`fa ${rating >= n ? "fa-star" : rating >= n - 0.5 ? "fa-star-half-o" : "fa-star-o"}`}
        />
      ))}
    </span>
  );
}
