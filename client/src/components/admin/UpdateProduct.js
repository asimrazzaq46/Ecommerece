import React, { Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAlert } from "react-alert";

import { updateProduct, getProductDetail, clearError } from "../../actions";
import MetaDAta from "../layouts/MetaDAta";
import Sidebar from "./Sidebar";
import { UPDATE_PRODUCT_RESET } from "../../constants/productConstants";

const UpdateProduct = ({ match, history }) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState("");
  const [catagory, setCatagory] = useState("");
  const [stock, setStock] = useState(0);
  const [seller, setSeller] = useState("");
  const [images, setImages] = useState([]);
  const [oldImages, setOldImages] = useState([]);
  const [imagesPreview, setImagesPreview] = useState([]);

  const alert = useAlert();
  const dispatch = useDispatch();

  const { error, product } = useSelector((state) => state.productDetails);

  const {
    error: updateError,
    loading,
    isUpdated,
  } = useSelector((state) => state.product);

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

  const productId = match.params.id;

  const submitHandler = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set("name", name);
    formData.set("price", price);
    formData.set("description", description);
    formData.set("catagory", catagory);
    formData.set("stock", stock);
    formData.set("seller", seller);

    images.forEach((image) => {
      formData.append("images", image);
    });

    dispatch(updateProduct(product._id, formData));
  };

  const onChange = (e) => {
    const files = Array.from(e.target.files);
    setImagesPreview([]);
    setImages([]);
    setOldImages([]);

    files.forEach((file) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (reader.readyState === 2) {
          setImagesPreview((oldArray) => [...oldArray, reader.result]);
          setImages((oldArray) => [...oldArray, reader.result]);
        }
      };

      reader.readAsDataURL(file);
    });
  };

  useEffect(() => {
    if (product && product._id !== productId) {
      dispatch(getProductDetail(productId));
    } else {
      setName(product.name);
      setPrice(product.price);
      setDescription(product.description);
      setCatagory(product.catagory);
      setStock(product.stock);
      setSeller(product.seller);
      setOldImages(product.images);
    }

    if (error) {
      alert.error(error);
      dispatch(clearError());
    }

    if (updateError) {
      alert.error(updateError);
      return dispatch(clearError());
    }

    if (isUpdated) {
      history.push("/admin/products");
      alert.success("Product updated Successfully");
      dispatch({ type: UPDATE_PRODUCT_RESET });
    }
  }, [dispatch, error, updateError, isUpdated, product, productId, history]);
  return (
    <Fragment>
      <MetaDAta title={"Update Product"} />
      <div className="row">
        <div className="col-12 col-md-2">
          <Sidebar />
        </div>

        <div className="col-12 col-md-10">
          <Fragment>
            <div className="wrapper my-5">
              <form
                className="shadow-lg"
                encType="multipart/form-data"
                onSubmit={submitHandler}
              >
                <h1 className="mb-4">Update Product</h1>

                <div className="form-group">
                  <label htmlFor="name_field">Name</label>
                  <input
                    type="text"
                    id="name_field"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="price_field">Price</label>
                  <input
                    type="text"
                    id="price_field"
                    className="form-control"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description_field">Description</label>
                  <textarea
                    className="form-control"
                    id="description_field"
                    rows="8"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="category_field">Category</label>
                  <select
                    className="form-control"
                    id="category_field"
                    value={catagory}
                    onChange={(e) => setCatagory(e.target.value)}
                  >
                    {categories.map((catagory) => {
                      return (
                        <option key={catagory} value={catagory}>
                          {catagory}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="stock_field">Stock</label>
                  <input
                    type="number"
                    id="stock_field"
                    className="form-control"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="seller_field">Seller Name</label>
                  <input
                    type="text"
                    id="seller_field"
                    className="form-control"
                    value={seller}
                    onChange={(e) => setSeller(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Images</label>

                  <div className="custom-file">
                    <input
                      type="file"
                      name="product_images"
                      className="custom-file-input"
                      id="customFile"
                      onChange={onChange}
                      multiple
                    />
                    <label className="custom-file-label" htmlFor="customFile">
                      Choose Images
                    </label>
                  </div>

                  {oldImages &&
                    oldImages.map((image) => {
                      return (
                        <img
                          src={image.url}
                          alt={image.url}
                          key={image}
                          width="55"
                          height="52"
                          className="mt-3 mr-2"
                        />
                      );
                    })}

                  {imagesPreview.map((image) => {
                    return (
                      <img
                        src={image}
                        key={image}
                        alt="images Preview"
                        className="mt-3 mr-2"
                        width="55"
                        height="52"
                      />
                    );
                  })}
                </div>

                <button
                  id="login_button"
                  type="submit"
                  className="btn btn-block py-3"
                  disabled={loading ? true : false}
                >
                  UPDATE
                </button>
              </form>
            </div>
          </Fragment>
        </div>
      </div>
    </Fragment>
  );
};

export default UpdateProduct;
