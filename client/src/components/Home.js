import React, { Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAlert } from "react-alert";
import Pagination from "react-js-pagination";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

import { getProducts } from "../actions";
import MetaDAta from "./layouts/MetaDAta";
import Products from "./products/products";
import Loader from "./layouts/Loader";

const { createSliderWithTooltip } = Slider;
const Range = createSliderWithTooltip(Slider.Range);

const Home = ({ match }) => {
  // here come all the states for the homepage
  const [page, setPage] = useState({ key: "", value: 1 });
  const [price, setPrice] = useState([1, 3000]);
  const [category, setCategory] = useState("");
  const [rating, setRating] = useState(0);

  // these are the categories which is already present in backend models of products
  const categories = [
    "Electronics",
    "Cameras",
    "Laptops",
    "Accessories",
    "Headphones",
    "Phones",
    "Foods",
    "Books",
    "Clothes/shoes",
    "Beauty/Health",
    "Sports",
    "Outdoor",
    "Home",
  ];

  const alert = useAlert();
  const dispatch = useDispatch();
  const keyWord = match.params.keyword; // getting the search word from pramas that was in backend with req.params.keyword

  const filterKey = JSON.stringify([keyWord, price, category, rating]);
  const currentPage = page.key === filterKey ? page.value : 1;

  // function for setting currentpage for pagination
  const setCurrentPageNumber = (pageNumber) => {
    setPage({ key: filterKey, value: pageNumber });
  };

  // taking out aal the data from reducers or from the state
  const {
    loading,
    products,
    resultPerPage,
    filteredProductsCount,
    error,
  } = useSelector((state) => state.products);

  // rendering everytime when the user will search or update or go to the homepage
  // passing dependencies like alerting the user with an error or keyword for search currentpage for page
  // filtering price with price and category
  useEffect(() => {
    dispatch(getProducts(keyWord, currentPage, price, category, rating));
  }, [dispatch, keyWord, currentPage, price, category, rating]);

  useEffect(() => { if (error) alert.error(error); }, [alert, error]);
  const count = filteredProductsCount || 0;

  // Rendering the home page with products
  return (
    <Fragment>
      {loading ? (
        <Loader />
      ) : (
        <Fragment>
          <MetaDAta title={"Buy best product online"} />
          <h1 id="products_heading">Latest Products</h1>
          {error && <div role="alert">{error} <button onClick={() => dispatch(getProducts(keyWord, currentPage, price, category, rating))}>Retry</button></div>}
          {!error && products?.length === 0 && <p>No products match your filters.</p>}
          <section id="products" className="container mt-5">
            <div className="row">
              {/* if there is any search item than we will show the filters otherwise we only going to render the products */}
              {keyWord ? (
                <Fragment>
                  <div className="col-6 col-md-3 mt-5 mb-5">
                    <div className="px-5">
                      <button type="button" className="btn btn-link mb-4" onClick={() => { setPrice([1, 3000]); setCategory(""); setRating(0); }}>Clear filters</button>
                      {/* Filter by price */}
                      <Range
                        marks={{
                          1: `$1`,
                          3000: `$3000`,
                        }}
                        min={1}
                        max={3000}
                        defaultValue={[1, 3000]}
                        tipFormatter={(value) => `$${value}`}
                        tipProps={{
                          placement: "top",
                          visible: true,
                        }}
                        value={price}
                        onChange={(price) => setPrice(price)}
                      />
                      {/* filter by categories */}
                      <hr className="my-5" />
                      <div className="mt-5">
                        <h4 className="mb-3">Categories</h4>
                        <ul className="pl-0">
                          {categories.map((category) => (
                            <li
                              style={{
                                cursor: "pointer",
                                listStyleType: "none",
                              }}
                              key={category}

                            >
                              <button type="button" className="btn btn-link p-0" onClick={() => setCategory(category)}>{category}</button>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {/* filter by Rating */}
                      <hr className="my-3" />

                      <div className="mt-5">
                        <h4 className="mb-3">Ratings</h4>
                        <ul className="pl-0">
                          {[5, 4, 3, 2, 1].map((star) => (
                            <li
                              style={{
                                cursor: "pointer",
                                listStyleType: "none",
                              }}
                              key={star}

                            >
                              <button type="button" className="btn p-0" aria-label={`${star} stars and above`} onClick={() => setRating(star)}>
                              <div className="rating-outer">
                                <div
                                  className="rating-inner"
                                  style={{ width: `${star * 20}%` }}
                                ></div>
                              </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-9">
                    <div className="row">
                      {products.map((product) => (
                        <Products key={product._id} product={product} col={4} />
                      ))}
                    </div>
                  </div>
                </Fragment>
              ) : (
                products &&
                products.map((product) => {
                  return (
                    <Products key={product._id} product={product} col={3} />
                  );
                })
              )}
            </div>
          </section>
          {/* if the items per page is less than total items  than the pagination will show otherwise NOT */}
          {resultPerPage < count && (
            <div className="d-flex justify-content-center mt-5">
              <Pagination
                activePage={currentPage}
                itemsCountPerPage={resultPerPage}
                totalItemsCount={count}
                onChange={setCurrentPageNumber}
                nextPageText={"next"}
                prevPageText={"prev"}
                firstPageText={"First"}
                lastPageText={"Last"}
                itemClass="page-item"
                linkClass="page-link"
              />
            </div>
          )}
        </Fragment>
      )}
    </Fragment>
  );
};

export default Home;
