import { useParams, useSearchParams, Link } from "react-router-dom";
import React, { Fragment, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAlert } from "./ui/Alerts";
import Pagination from "./ui/Pagination";

import { useProducts, messageFor } from "../queries/products";
import { PRODUCT_CATEGORIES } from "../constants/productCategories";
import { formatPrice } from "../i18n";
import MetaDAta from "./layouts/MetaDAta";
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

  // here come all the states for the homepage
  const [page, setPage] = useState({ key: "", value: 1 });
  const [price, setPrice] = useState(PRICE_RANGE);
  const [rating, setRating] = useState(0);
  const [sort, setSort] = useState("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const alert = useAlert();

  const keyWord = params.keyword; // getting the search word from pramas that was in backend with req.params.keyword

  const filterKey = JSON.stringify([keyWord, price, categorySelection, rating, sort]);
  const currentPage = page.key === filterKey ? page.value : 1;

  // function for setting currentpage for pagination
  const setCurrentPageNumber = (pageNumber) => {
    setPage({ key: filterKey, value: pageNumber });
  };

  const setCategory = (category) => setSearchParams(category ? { category } : {});
  const resetFilters = () => {
    setPrice(PRICE_RANGE);
    setCategory("");
    setRating(0);
  };

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
      <MetaDAta title={keyWord ? t("catalog.searchPageTitle", { keyword: keyWord }) : t("catalog.pageTitle")} />
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
        ) : (
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
                    <a className="vx-btn vx-btn--primary" href="#catalog">
                      {t("catalog.hero.shop")}
                    </a>
                    <a className="vx-btn vx-btn--soft" href="#categories">
                      {t("catalog.hero.browse")} <i className="fa fa-arrow-right" aria-hidden="true" />
                    </a>
                  </div>
                </div>
                <div className="vx-hero-media">
                  <img src="/assets/home-hero-image.webp" alt="" width="500" height="625" />
                </div>
              </div>
            </section>
            <section className="vx-pills" id="categories" aria-label={t("catalog.categories")}>
              <div className="vx-container vx-pills-row">
                {["", ...PRODUCT_CATEGORIES].map((value) => (
                  <button
                    key={value || "all"}
                    type="button"
                    className={`vx-pill${categorySelection === value ? " is-active" : ""}`}
                    aria-pressed={categorySelection === value}
                    onClick={() => setCategory(value)}
                  >
                    {value ? t(`categories.${value}`) : t("catalog.allProducts")}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

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
                <p className="vx-muted">
                  {query.isFetching && !loading ? t("catalog.updating") : t("catalog.showing", { from, to, total: count })}
                </p>
                <div className="vx-toolbar-actions">
                  <button type="button" className="vx-btn vx-btn--soft vx-filters-toggle" onClick={() => setFiltersOpen(true)}>
                    <i className="fa fa-sliders" aria-hidden="true" /> {t("catalog.filters")}
                  </button>
                  <label className="vx-sort">
                    <span className="vx-label">{t("catalog.sortBy")}</span>
                    <select className="vx-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                      {SORTS.map((value) => (
                        <option key={value} value={value}>
                          {t(`catalog.sort.${value}`)}
                        </option>
                      ))}
                    </select>
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
