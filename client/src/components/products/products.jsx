import React from "react";
import { Link } from "react-router-dom";

const products = ({ product, col }) => {
  return (
    <div className={`col-sm-12 col-md-6 col-lg-${col} my-3`}>
      <div className="card p-3 rounded">
        <img
          className="card-img-top mx-auto"
          src={product.images[0].url}
          alt={product.name}
        />
        <div className="card-body d-flex flex-column">
          <h2 className="card-title h5">
            <Link to={`/product/${product._id}`}>{product.name}</Link>
          </h2>
          <div className="ratings mt-auto">
            <div className="rating-outer" role="img" aria-label={`${product.rating} out of 5 stars`}>
              <div
                className="rating-inner" aria-hidden="true"
                style={{ width: `${(product.rating / 5) * 100}%` }}
              ></div>
            </div>
            <span className="no_of_reviews">({product.NumOfReviews} Reviews)</span>
          </div>
          <p className="card-text">${product.price}</p>
          <Link
            to={`/product/${product._id}`}
            aria-label={`View details for ${product.name}`}
            className="view-product btn btn-block"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default products;
