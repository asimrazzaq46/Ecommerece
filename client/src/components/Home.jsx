import { useParams } from "react-router-dom";
import React, { Fragment, useEffect, useState } from "react";
import { useAlert } from "./ui/Alerts";
import Pagination from "./ui/Pagination";

import { useProducts, messageFor } from "../queries/products";
import MetaDAta from "./layouts/MetaDAta";
import Products from "./products/products";
import Loader from "./layouts/Loader";

const Home = () => {
  const params = useParams();

  // here come all the states for the homepage
  const [page, setPage] = useState({ key: "", value: 1 });
  const [price, setPrice] = useState([1, 3000]);
  const [categorySelection, setCategory] = useState("");
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

  const keyWord = params.keyword; // getting the search word from pramas that was in backend with req.params.keyword

  const filterKey = JSON.stringify([keyWord, price, categorySelection, rating]);
  const currentPage = page.key === filterKey ? page.value : 1;

  // function for setting currentpage for pagination
  const setCurrentPageNumber = (pageNumber) => {
    setPage({ key: filterKey, value: pageNumber });
  };

  // taking out aal the data from reducers or from the state
  const query = useProducts({
    keyword: keyWord,
    page: currentPage,
    price,
    category: categorySelection,
    rating,
  });
  const {
    products = [],
    resultPerPage = 10,
    filteredProductsCount = 0,
  } = query.data || {};
  const loading = query.isPending;
  const error = query.error ? messageFor(query.error) : null;
  const count = filteredProductsCount;
  useEffect(() => {
    if (error) alert.error(error);
  }, [alert, error]);

  // Rendering the home page with products
  return (
    <Fragment>
      {loading ? (
        <Loader />
      ) : (
        <Fragment>
          <MetaDAta title={"Buy best product online"} />
          <h1 id="products_heading">Latest Products</h1>
          {query.isFetching && <p role="status">Updating products…</p>}
          {error && (
            <div role="alert">
              {error} <button onClick={() => query.refetch()}>Retry</button>
            </div>
          )}
          {!error && products?.length === 0 && (
            <p>No products match your filters.</p>
          )}
          <section id="products" className="container mt-5">
            <div className="row">
              <Fragment>
                <div className="col-12 col-md-3 mt-5 mb-5">
                  <div className="px-1 px-md-3">
                    <button
                      type="button"
                      className="btn btn-link mb-4"
                      onClick={() => {
                        setPrice([1, 3000]);
                        setCategory("");
                        setRating(0);
                      }}
                    >
                      Clear filters
                    </button>
                    {/* Filter by price */}
                    <label>
                      Minimum price: ${price[0]}
                      <input
                        aria-label="Minimum price"
                        type="range"
                        min="1"
                        max="3000"
                        value={price[0]}
                        onChange={(e) =>
                          setPrice([
                            Math.min(Number(e.target.value), price[1]),
                            price[1],
                          ])
                        }
                      />
                    </label>
                    <label>
                      Maximum price: ${price[1]}
                      <input
                        aria-label="Maximum price"
                        type="range"
                        min="1"
                        max="3000"
                        value={price[1]}
                        onChange={(e) =>
                          setPrice([
                            price[0],
                            Math.max(Number(e.target.value), price[0]),
                          ])
                        }
                      />
                    </label>
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
                            <button
                              type="button"
                              className="btn btn-link p-0"
                              aria-pressed={category === categorySelection}
                              onClick={() => setCategory(category)}
                            >
                              {category}
                            </button>
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
                            <button
                              type="button"
                              className="btn p-0"
                              aria-label={`${star} stars and above`}
                              onClick={() => setRating(star)}
                            >
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
                <div className="col-12 col-md-9">
                  <div className="row">
                    {products.map((product) => (
                      <Products key={product._id} product={product} col={4} />
                    ))}
                  </div>
                </div>
              </Fragment>
            </div>
          </section>
          {/* if the items per page is less than total items  than the pagination will show otherwise NOT */}
          {resultPerPage < count && (
            <div className="d-flex justify-content-center mt-5">
              <Pagination
                activePage={currentPage}
                disabled={query.isPlaceholderData}
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
