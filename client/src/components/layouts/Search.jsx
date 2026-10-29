import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

// UPDATED: Veyra search bar; `variant` switches between the header bar and the search-page box.
const Search = ({ variant = "header", defaultValue = "" }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [keyWord, setKeyword] = useState(defaultValue);

  const SearchHandler = (e) => {
    e.preventDefault();
    if (keyWord.trim()) {
      navigate(`/search/${encodeURIComponent(keyWord.trim())}`);
    } else {
      navigate(`/`);
    }
  };
  return (
    <form role="search" className={`vx-search vx-search--${variant}`} onSubmit={SearchHandler}>
      {variant === "page" && <i className="fa fa-search vx-search-icon" aria-hidden="true" />}
      <input
        type="search"
        aria-label={t("search.label")}
        className="vx-search-input"
        placeholder={t("search.placeholder")}
        value={keyWord}
        onChange={(e) => setKeyword(e.target.value)}
      />
      {variant === "page" && keyWord && (
        <button type="button" className="vx-search-clear" aria-label={t("search.clear")} onClick={() => setKeyword("")}>
          <i className="fa fa-times" aria-hidden="true" />
        </button>
      )}
      <button type="submit" className="vx-search-submit" aria-label={t("search.submit")}>
        {variant === "page" ? t("search.submit") : <i className="fa fa-search" aria-hidden="true" />}
      </button>
    </form>
  );
};

export default Search;
