import { useNavigate } from "react-router-dom";
import React, { useState } from "react";

const Search = () => {
  const navigate = useNavigate();

  const [keyWord, setKeyword] = useState("");
  
  
  
  const SearchHandler = (e) => {
    e.preventDefault();
    if (keyWord.trim()) {
      navigate(`/search/${encodeURIComponent(keyWord.trim())}`);
    } else {
      navigate(`/`);
    }
  };
  return (
    <form role="search" onSubmit={SearchHandler}>
      <div className="input-group">
        <input
          type="text"
          id="search_field"
          aria-label="Search products"
          className="form-control"
          placeholder="Enter Product Name ..."
          onChange={(e) => setKeyword(e.target.value)}
        />
        <div className="input-group-append">
          <button type="submit" aria-label="Search" id="search_btn" className="btn">
            <i className="fa fa-search" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </form>
  );
};

export default Search;
