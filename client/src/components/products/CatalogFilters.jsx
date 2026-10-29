// UPDATED: catalog sidebar filters (category, price, rating), also used as the mobile drawer.
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { PRODUCT_CATEGORIES } from "../../constants/productCategories";
import Stars from "../ui/Stars";

export const PRICE_RANGE = [1, 3000];

export default function CatalogFilters({ category, onCategory, price, onPrice, rating, onRating, onReset, onClose }) {
  const { t } = useTranslation();
  // Draft price is applied on submit; the parent re-keys this component when the applied price changes.
  const [draft, setDraft] = useState(price);
  const invalid = !(draft[0] >= PRICE_RANGE[0] && draft[1] <= PRICE_RANGE[1] && draft[0] <= draft[1]);

  return (
    <div className="vx-filters-inner">
      <div className="vx-filters-head">
        <h2 className="vx-title-sm">
          <i className="fa fa-sliders" aria-hidden="true" /> {t("catalog.filters")}
        </h2>
        <button type="button" className="vx-filters-reset" onClick={onReset}>
          {t("catalog.reset")}
        </button>
        {onClose && (
          <button type="button" className="vx-icon-btn vx-filters-close" aria-label={t("catalog.closeFilters")} onClick={onClose}>
            <i className="fa fa-times" aria-hidden="true" />
          </button>
        )}
      </div>

      <fieldset className="vx-filter-group">
        <legend className="vx-filter-title">{t("catalog.categories")}</legend>
        {["", ...PRODUCT_CATEGORIES].map((value) => (
          <label key={value || "all"} className="vx-filter-option">
            <input type="radio" name="category" checked={category === value} onChange={() => onCategory(value)} />
            <span>{value ? t(`categories.${value}`) : t("catalog.allProducts")}</span>
          </label>
        ))}
      </fieldset>

      <form
        className="vx-filter-group vx-filter-price"
        onSubmit={(e) => {
          e.preventDefault();
          if (!invalid) onPrice(draft);
        }}
      >
        <div className="vx-filter-title-row">
          <span className="vx-filter-title">{t("catalog.price")}</span>
        </div>
        <div className="vx-price-inputs">
          <label>
            <span className="vx-sr-only">{t("catalog.min")}</span>
            <input
              type="number"
              className="vx-input"
              min={PRICE_RANGE[0]}
              max={PRICE_RANGE[1]}
              value={draft[0]}
              aria-label={t("catalog.min")}
              onChange={(e) => setDraft([Number(e.target.value), draft[1]])}
            />
          </label>
          <span className="vx-muted">{t("catalog.to")}</span>
          <label>
            <span className="vx-sr-only">{t("catalog.max")}</span>
            <input
              type="number"
              className="vx-input"
              min={PRICE_RANGE[0]}
              max={PRICE_RANGE[1]}
              value={draft[1]}
              aria-label={t("catalog.max")}
              onChange={(e) => setDraft([draft[0], Number(e.target.value)])}
            />
          </label>
          <button type="submit" className="vx-btn vx-btn--primary vx-btn--caps vx-price-apply" disabled={invalid}>
            {t("catalog.apply")}
          </button>
        </div>
        {invalid && <p className="vx-filter-error">{t("catalog.priceInvalid")}</p>}
      </form>

      <fieldset className="vx-filter-group">
        <legend className="vx-filter-title">{t("catalog.rating")}</legend>
        {[0, 4, 3, 2, 1].map((star) => (
          <label key={star} className="vx-filter-option">
            <input type="radio" name="rating" checked={rating === star} onChange={() => onRating(star)} />
            {star ? (
              <>
                <Stars value={star} />
                <span>{t("catalog.ratingAndUp", { count: star })}</span>
              </>
            ) : (
              <span>{t("catalog.anyRating")}</span>
            )}
          </label>
        ))}
      </fieldset>

      <button type="button" className="vx-btn vx-btn--soft vx-filters-reset-all" onClick={onReset}>
        <i className="fa fa-undo" aria-hidden="true" /> {t("catalog.resetAll")}
      </button>
      {onClose && (
        <button type="button" className="vx-btn vx-btn--primary vx-filters-show" onClick={onClose}>
          {t("catalog.showResults")}
        </button>
      )}
    </div>
  );
}
