import React, { useState } from "react";

const Search = ({ history }) => {
  const [keyWord, setKeyword] = useState("");
  const SearchHandler = (e) => {
    e.preventDefault();
    if (keyWord.trim()) {
      history.push(`/search/${keyWord}`);
    } else {
      history.push(`/`);
    }
  };
  return (
    <form onSubmit={SearchHandler}>
      <div className="input-group">
        <input
          type="text"
          id="search_field"
          className="form-control"
          placeholder="Enter Product Name ..."
          onChange={(e) => setKeyword(e.target.value)}
        />
        <div className="input-group-append">
          <button id="search_btn" className="btn">
            <i className="fa fa-search" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </form>
  );
};

export default Search;
