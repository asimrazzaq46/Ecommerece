import { useParams, useSearchParams, Link } from "react-router-dom";
import React, { Fragment, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAlert } from "./ui/Alerts";
import Pagination from "./ui/Pagination";
import Select from "./ui/Select";

import { useProducts, messageFor } from "../queries/products";
import { PRODUCT_CATEGORIES } from "../constants/productCategories";
import { formatPrice } from "../i18n";
import Seo, { absoluteUrl } from "./layouts/Seo";
import Search from "./layouts/Search";
import Products from "./products/products";
import CatalogFilters, { PRICE_RANGE } from "./products/CatalogFilters";
import "./products/Catalog.css";

const SORTS = ["newest", "price_asc", "price_desc", "rating"];

const Home = () => {
  const params = useParams();
  const { t } = useTranslation();
  // UPDATED: category lives in the URL (?category=) so header/footer links can open a filtered catalog
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySelection = searchParams.get("category") || "";

  // UPDATED: every filter, the sort and the page live in the URL (?category, rating, min, max, sort, page),
  // so Back/Forward and shared links restore the same results.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const alert = useAlert();
  const keyWord = params.keyword; // getting the search word from pramas that was in backend with req.params.keyword

  const num = (name, fallback, min, max) => {
    const n = Number(searchParams.get(name));
    return Number.isFinite(n) && searchParams.get(name) !== null && n >= min && n <= max ? n : fallback;
  };
  const price = [num("min", PRICE_RANGE[0], PRICE_RANGE[0], PRICE_RANGE[1]), num("max", PRICE_RANGE[1], PRICE_RANGE[0], PRICE_RANGE[1])];
  const rating = num("rating", 0, 0, 4);
  const sortParam = searchParams.get("sort");
  const sort = SORTS.includes(sortParam) ? sortParam : "newest";
  const currentPage = Math.floor(num("page", 1, 1, 1000));

  // UPDATED: single entry point for every catalog change. Applies the patch to the URL (dropping defaults),
  // returns to page 1 unless the page itself changed, closes the mobile drawer and asks for one scroll.
  const scrollAfterChange = useRef(false);
  const update = (patch) => {
    const next = new URLSearchParams(searchParams);
    const merged = { page: 1, ...patch };
    const defaults = { category: "", rating: 0, min: PRICE_RANGE[0], max: PRICE_RANGE[1], sort: "newest", page: 1 };
    Object.entries(merged).forEach(([k, v]) => (v === defaults[k] || v === undefined ? next.delete(k) : next.set(k, v)));
    if (next.toString() === searchParams.toString()) return;
    scrollAfterChange.current = true;
    setFiltersOpen(false);
    setSearchParams(next);
  };
  // After the new results render (so a vanishing hero cannot shift the target), bring the catalog top into view
  // below the sticky header. Runs for zero results too and never on first load (flag is only set by update()).
  const queryString = searchParams.toString();
  useEffect(() => {
    if (!scrollAfterChange.current) return;
    scrollAfterChange.current = false;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("catalog")?.scrollIntoView?.({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [queryString]);

  const setCategory = (category) => update({ category });
  const setCurrentPageNumber = (pageNumber) => update({ page: pageNumber });
  const setPrice = ([min, max]) => update({ min, max });
  const setRating = (value) => update({ rating: value });
  const setSort = (value) => update({ sort: value });
  const resetFilters = () => update({ category: "", rating: 0, min: PRICE_RANGE[0], max: PRICE_RANGE[1] });

  // taking out aal the data from reducers or from the state
  const query = useProducts({
    keyword: keyWord,
    page: currentPage,
    price,
    category: categorySelection,
    rating,
    sort,
  });
  const {
    products = [],
    resultPerPage = 12,
    filteredProductsCount = 0,
  } = query.data || {};
  const loading = query.isPending;
  const error = query.error ? messageFor(query.error) : null;
  const count = filteredProductsCount;
  useEffect(() => {
    if (error) alert.error(error);
  }, [alert, error]);

  // UPDATED: close the mobile drawer with Escape
  useEffect(() => {
    if (!filtersOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setFiltersOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [filtersOpen]);

  const priceActive = price[0] !== PRICE_RANGE[0] || price[1] !== PRICE_RANGE[1];
  // UPDATED: the hero belongs to the plain home page only: not on search results, a chosen category,
  // active filters or later result pages
  const showHero = !keyWord && !categorySelection && !priceActive && rating === 0 && currentPage === 1;
  // "Shop now" / "Browse categories": smooth scroll to the products (offset handled by scroll-margin-top);
  // on small screens "Browse categories" opens the filter drawer, which holds the category list.
  const goToCatalog = (openFilters) => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("catalog")?.scrollIntoView?.({ behavior: reduce ? "auto" : "smooth", block: "start" });
    if (openFilters && window.matchMedia?.("(max-width: 1023px)").matches) setFiltersOpen(true);
  };
  const chips = [
    keyWord && { label: `“${keyWord}”`, to: "/" },
    categorySelection && { label: t(`categories.${categorySelection}`), clear: () => setCategory("") },
    priceActive && { label: `${formatPrice(price[0])} – ${formatPrice(price[1])}`, clear: () => setPrice(PRICE_RANGE) },
    rating > 0 && { label: t("catalog.chipRating", { count: rating }), clear: () => setRating(0) },
  ].filter(Boolean);
  const from = count ? (currentPage - 1) * resultPerPage + 1 : 0;
  const to = Math.min(currentPage * resultPerPage, count);

  // Rendering the home page with products
  return (
    <Fragment>
      {/* UPDATED: only the plain home page and a single-category listing are indexable; keyword searches and
          price/rating/sort/page variants are noindex so they cannot create duplicate content. */}
      <Seo
        title={keyWord ? t("catalog.searchPageTitle", { keyword: keyWord }) : categorySelection ? t(`categories.${categorySelection}`) : t("seo.homeTitle")}
        description={categorySelection ? t("seo.categoryDescription", { category: t(`categories.${categorySelection}`) }) : t("seo.homeDescription")}
        path={categorySelection ? `/?category=${encodeURIComponent(categorySelection)}` : "/"}
        image="/assets/home-hero-image.webp"
        follow
        noindex={Boolean(keyWord) || priceActive || rating > 0 || searchParams.has("sort") || searchParams.has("page")}
        jsonLd={categorySelection ? [] : [
          { "@context": "https://schema.org", "@type": "WebSite", name: "Veyra", url: absoluteUrl("/"), potentialAction: { "@type": "SearchAction", target: absoluteUrl("/search/{search_term_string}"), "query-input": "required name=search_term_string" } },
          { "@context": "https://schema.org", "@type": "Organization", name: "Veyra", url: absoluteUrl("/") },
        ]}
      />
      {/* UPDATED: Veyra catalog (Stitch homepage + search results designs) */}
      <div className="vx-page vx-catalog">
        {keyWord ? (
          <section className="vx-search-head">
            <div className="vx-container">
              <nav className="vx-breadcrumb" aria-label="Breadcrumb">
                <Link to="/">{t("nav.home")}</Link>
                <i className="fa fa-angle-right" aria-hidden="true" />
                <span>{t("catalog.searchResults")}</span>
              </nav>
              <div className="vx-search-head-row">
                <div>
                  {!loading && !error && (
                    <span className="vx-pill-soft">{t("catalog.resultsCount", { count })}</span>
                  )}
                  <h1 className="vx-title-xl">
                    {t("catalog.resultsFor")} <em>“{keyWord}”</em>
                  </h1>
                </div>
                <div className="vx-search-head-box">
                  <Search key={keyWord} variant="page" defaultValue={keyWord} />
                </div>
              </div>
            </div>
          </section>
        ) : showHero ? (
          <>
            <section className="vx-hero">
              <div className="vx-container vx-hero-grid">
                <div className="vx-hero-copy">
                  <span className="vx-hero-badge">
                    <i className="fa fa-certificate" aria-hidden="true" /> {t("catalog.hero.badge")}
                  </span>
                  <h1 className="vx-hero-title">{t("catalog.hero.title")}</h1>
                  <p className="vx-hero-text">{t("catalog.hero.subtitle")}</p>
                  <div className="vx-hero-actions">
                    <button type="button" className="vx-btn vx-btn--primary" onClick={() => goToCatalog(false)}>
                      {t("catalog.hero.shop")}
                    </button>
                    <button type="button" className="vx-btn vx-btn--soft" onClick={() => goToCatalog(true)}>
                      {t("catalog.hero.browse")} <i className="fa fa-arrow-right" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="vx-hero-media">
                  <img src="/assets/home-hero-image.webp" alt="" width="500" height="625" fetchPriority="high" /> {/* UPDATED: LCP image */}
                </div>
              </div>
            </section>
          </>
        ) : null}

        <section className="vx-container vx-catalog-body" id="catalog">
          {chips.length > 0 && (
            <div className="vx-chips">
              <span className="vx-label">{t("catalog.applied")}</span>
              {chips.map((chip) => (
                <span key={chip.label} className="vx-chip">
                  {chip.label}
                  {chip.to ? (
                    <Link to={chip.to} aria-label={t("catalog.removeFilter", { label: chip.label })}>
                      <i className="fa fa-times" aria-hidden="true" />
                    </Link>
                  ) : (
                    <button type="button" aria-label={t("catalog.removeFilter", { label: chip.label })} onClick={chip.clear}>
                      <i className="fa fa-times" aria-hidden="true" />
                    </button>
                  )}
                </span>
              ))}
              <button type="button" className="vx-link-btn" onClick={resetFilters}>
                {t("catalog.clearAll")}
              </button>
            </div>
          )}

          <div className="vx-catalog-grid">
            <aside className={`vx-filters vx-card${filtersOpen ? " is-open" : ""}`} aria-label={t("catalog.filters")}>
              <CatalogFilters
                key={price.join("-")}
                category={categorySelection}
                onCategory={setCategory}
                price={price}
                onPrice={setPrice}
                rating={rating}
                onRating={setRating}
                onReset={resetFilters}
                onClose={() => setFiltersOpen(false)}
              />
            </aside>
            {filtersOpen && <div className="vx-scrim" onClick={() => setFiltersOpen(false)} />}

            <div className="vx-results">
              <div className="vx-toolbar vx-card">
                <p className="vx-muted" role="status" aria-live="polite">
                  {query.isFetching && !loading ? t("catalog.updating") : t("catalog.showing", { from, to, total: count })}
                </p>
                <div className="vx-toolbar-actions">
                  <button type="button" className="vx-btn vx-btn--soft vx-filters-toggle" onClick={() => setFiltersOpen(true)}>
                    <i className="fa fa-sliders" aria-hidden="true" /> {t("catalog.filters")}
                  </button>
                  <label className="vx-sort">
                    <span className="vx-label">{t("catalog.sortBy")}</span>
                    <Select
                      value={sort}
                      onChange={setSort}
                      label={t("catalog.sortBy")}
                      options={SORTS.map((value) => ({ value, label: t(`catalog.sort.${value}`) }))}
                    />
                  </label>
                </div>
              </div>

              {loading ? (
                <div className="vx-grid" role="status" aria-label={t("catalog.loading")}>
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="vx-product-card vx-skeleton" aria-hidden="true" />
                  ))}
                </div>
              ) : error ? (
                <div className="vx-card vx-state" role="alert">
                  <span className="vx-state-icon"><i className="fa fa-exclamation-triangle" aria-hidden="true" /></span>
                  <h2 className="vx-title-md">{t("catalog.errorTitle")}</h2>
                  <p>{error}</p>
                  <button type="button" className="vx-btn vx-btn--primary" onClick={() => query.refetch()}>
                    {t("catalog.retry")}
                  </button>
                </div>
              ) : products.length === 0 ? (
                <div className="vx-card vx-state">
                  <span className="vx-state-icon"><i className="fa fa-search" aria-hidden="true" /></span>
                  <h2 className="vx-title-md">{t("catalog.emptyTitle")}</h2>
                  <p>{t("catalog.emptyText")}</p>
                  <button type="button" className="vx-btn vx-btn--soft" onClick={resetFilters}>
                    {t("catalog.resetAll")}
                  </button>
                </div>
              ) : (
                <div className={`vx-grid${query.isFetching ? " is-fetching" : ""}`}>
                  {products.map((product) => (
                    <Products key={product._id} product={product} />
                  ))}
                </div>
              )}

              {/* if the items per page is less than total items  than the pagination will show otherwise NOT */}
              {resultPerPage < count && (
                <Pagination
                  activePage={currentPage}
                  disabled={query.isPlaceholderData}
                  itemsCountPerPage={resultPerPage}
                  totalItemsCount={count}
                  onChange={setCurrentPageNumber}
                />
              )}
            </div>
          </div>
        </section>
      </div>
    </Fragment>
  );
};

export default Home;
