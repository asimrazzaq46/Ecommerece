import axios from "axios";

//PRODUCT CONSTANTS
import {
  ALL_PRODUCT_REQUEST,
  ALL_PRODUCT_SUCCESS,
  ALL_PRODUCT_FAIL,
  PRODUCT_DETAILS_REQUEST,
  PRODUCT_DETAILS_SUCCESS,
  PRODUCT_DETAILS_FAIL,
  NEW_REVIEW_REQUEST,
  NEW_REVIEW_SUCCESS,
  NEW_REVIEW_FAIL,
  ADMIN_PRODUCT_REQUEST,
  ADMIN_PRODUCT_SUCCESS,
  ADMIN_PRODUCT_FAIL,
  NEW_PRODUCT_REQUEST,
  NEW_PRODUCT_SUCCESS,
  NEW_PRODUCT_FAIL,
  DELETE_PRODUCT_REQUEST,
  DELETE_PRODUCT_SUCCESS,
  DELETE_PRODUCT_FAIL,
  UPDATE_PRODUCT_REQUEST,
  UPDATE_PRODUCT_SUCCESS,
  UPDATE_PRODUCT_FAIL,
  CLEAR_ERRORS,
} from "../constants/productConstants";

// AUTH CONSTANTS
import {
  LOGIN_REQUEST,
  LOGIN_FAIL,
  LOGIN_SUCCESS,
  REGISTER_USER_REQUEST,
  REGISTER_USER_SUCCESS,
  LOAD_USER_REQUEST,
  LOAD_USER_SUCCESS,
  LOAD_USER_FAIL,
  LOGOUT_SUCCESS,
  LOGOUT_FAIL,
  REGISTER_USER_FAIL,
} from "../constants/authConstants";

// USER CONSTANTS

import {
  UPDATE_PROFILE_REQUEST,
  UPDATE_PROFILE_FAIL,
  UPDATE_PROFILE_SUCCESS,
  UPDATE_PASSWORD_REQUEST,
  UPDATE_PASSWORD_SUCCESS,
  UPDATE_PASSWORD_FAIL,
  FORGOT_PASSWORD_REQUEST,
  FORGOT_PASSWORD_SUCCESS,
  FORGOT_PASSWORD_FAIL,
  NEW_PASSWORD_REQUEST,
  NEW_PASSWORD_SUCCESS,
  NEW_PASSWORD_FAIL,
  ALL_USERS_REQUEST,
  ALL_USERS_SUCCESS,
  ALL_USERS_FAIL,
  UPDATE_USER_REQUEST,
  UPDATE_USER_SUCCESS,
  UPDATE_USER_FAIL,
  USER_DETAILS_REQUEST,
  USER_DETAILS_SUCCESS,
  USER_DETAILS_FAIL,
} from "../constants/userConstants";

// CART CONSTANTS

import { ADD_TO_CART, REMOVE_ITEM_CART } from "../constants/cartConstants";

// SHIPPING CONSTANTS

import { SAVE_SHIPPING_INFO } from "../constants/shippingConstants";

// ORDER CONSTANTS
import {
  CREATE_ORDER_REQUEST,
  CREATE_ORDER_SUCCESS,
  CREATE_ORDER_FAIL,
  MY_ORDERS_REQUEST,
  MY_ORDERS_SUCCESS,
  MY_ORDERS_FAIL,
  ORDER_DETAILS_REQUEST,
  ORDER_DETAILS_SUCCESS,
  ORDER_DETAILS_FAIL,
  ALL_ORDERS_REQUEST,
  ALL_ORDERS_SUCCESS,
  ALL_ORDERS_FAIL,
  UPDATE_ORDER_REQUEST,
  UPDATE_ORDER_SUCCESS,
  UPDATE_ORDER_FAIL,
  DELETE_ORDER_REQUEST,
  DELETE_ORDER_SUCCESS,
  DELETE_ORDER_FAIL,
} from "../constants/orderConstants";

//////////////////////////////////////////////////////////////////////////////////

////// PRODUCTS(HOME AND PRODUCT DETAIL) ///////

//////////////////////////////////////////////////////////////////////////////////

////////////////////////////////  PRODUCTS ACTION ///////////////////////////////////////////////////

// get all product on the Home screen
export const getProducts =
  (keyword = "", currentPage = 1, price, category, rating = 0) =>
  async (dispatch) => {
    try {
      dispatch({
        type: ALL_PRODUCT_REQUEST,
      });

      let link = `/api/v1/products?keyword=${keyword}&page=${currentPage}&price[lte]=${price[1]}
                  &price[gte]=${price[0]}&rating[gte]=${rating}`;

      if (category) {
        link = `/api/v1/products?keyword=${keyword}&page=${currentPage}&price[lte]=${price[1]}
                &price[gte]=${price[0]}&catagory=${category}&rating[gte]=${rating}`;
      }

      const { data } = await axios.get(link); // REQUEST TO THE SERVER

      dispatch({ type: ALL_PRODUCT_SUCCESS, payload: data });
    } catch (error) {
      dispatch({
        type: ALL_PRODUCT_FAIL,
        payload: error.response.data.Message,
      });
    }
  };

// Get detail of the product by clicking it

export const getProductDetail = (id) => async (dispatch) => {
  try {
    dispatch({
      type: PRODUCT_DETAILS_REQUEST,
    });
    const { data } = await axios.get(`/api/v1/product/${id}`);
    dispatch({ type: PRODUCT_DETAILS_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: PRODUCT_DETAILS_FAIL,
      payload: error.response.data.Message,
    });
  }
};

//////////////////////////////////////////////////////////////////////////////////

////// REVIEWS ///////

//////////////////////////////////////////////////////////////////////////////////

//////////////////////////////// CREATE NEW REVIEW ACTION ///////////////////////////////////////////////////

// NEW REVIEW

export const newReview = (reviewData) => async (dispatch) => {
  try {
    dispatch({
      type: NEW_REVIEW_REQUEST,
    });

    const config = {
      headers: {
        "content-Type": "application/json",
      },
    };

    const { data } = await axios.put(`/api/v1/review`, reviewData, config);

    dispatch({ type: NEW_REVIEW_SUCCESS, payload: data.success });
  } catch (error) {
    dispatch({
      type: NEW_REVIEW_FAIL,
      payload: error.response.data.message,
    });
  }
};

//////////////////////////////////////////////////////////////////////////////////

////// AUTHORIZATION (REGISTRATION, LOGIN , LOGOUT) ///////

//////////////////////////////////////////////////////////////////////////////////

////////////////////////////////  AUTHORIZATION ACTION ///////////////////////////////////////////////////

export const login = (email, password) => async (dispatch) => {
  try {
    dispatch({ type: LOGIN_REQUEST });
    const config = {
      headers: {
        "content-Type": "application/json",
      },
    };
    const { data } = await axios.post(
      `/api/v1/login`,
      { email, password },
      config
    );
    dispatch({ type: LOGIN_SUCCESS, payload: data.user });
  } catch (error) {
    dispatch({
      type: LOGIN_FAIL,
      payload: error.response.data.Message,
    });
  }
};

////////////////////////////////  REGISTERATION ACTION ///////////////////////////////////////////////////

export const register = (userData) => async (dispatch) => {
  try {
    dispatch({ type: REGISTER_USER_REQUEST });
    const config = {
      headers: {
        "content-Type": "multipart/form-data",
      },
    };
    const { data } = await axios.post(`/api/v1/register`, userData, config);
    dispatch({ type: REGISTER_USER_SUCCESS, payload: data.user });
  } catch (error) {
    dispatch({
      type: REGISTER_USER_FAIL,
      payload: error.response.data.Message,
    });
  }
};

////////////////////  LOAD USER ACTION  (CONSIST LOGIN) /////////////////////

export const loadUser = () => async (dispatch) => {
  try {
    dispatch({ type: LOAD_USER_REQUEST });

    const { data } = await axios.get(`/api/v1/me`);
    dispatch({ type: LOAD_USER_SUCCESS, payload: data.user });
  } catch (error) {
    dispatch({
      type: LOAD_USER_FAIL,
      payload: error.response.data.Message,
    });
  }
};

////////////////////  LOGOUT USER ACTION  /////////////////////

export const logout = () => async (dispatch) => {
  try {
    await axios.get(`/api/v1/logout`);
    dispatch({ type: LOGOUT_SUCCESS });
  } catch (error) {
    dispatch({
      type: LOGOUT_FAIL,
      payload: error.response.data.Message,
    });
  }
};

//////////////////////////////////////////////////////////////////////////////////

////// PASSWORD AND PROFILE ///////

//////////////////////////////////////////////////////////////////////////////////

////////////////////////////////  UPDATE PROFILE ACTION ///////////////////////////////////////////////////

export const updateProfile = (userData) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_PROFILE_REQUEST });
    const config = {
      headers: {
        "content-Type": "multipart/form-data",
      },
    };
    const { data } = await axios.put(`/api/v1/me/update`, userData, config);
    dispatch({ type: UPDATE_PROFILE_SUCCESS, payload: data.success });
  } catch (error) {
    dispatch({
      type: UPDATE_PROFILE_FAIL,
      payload: error.response.data.Message,
    });
  }
};

////////////////////////////////  UPDATE PASSWORD ACTION ///////////////////////////////////////////////////

export const updatePassword = (passwords) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_PASSWORD_REQUEST });
    const config = {
      headers: {
        "content-Type": "application/json",
      },
    };
    const { data } = await axios.put(
      `/api/v1/password/update`,
      passwords,
      config
    );
    dispatch({ type: UPDATE_PASSWORD_SUCCESS, payload: data.success });
  } catch (error) {
    dispatch({
      type: UPDATE_PASSWORD_FAIL,
      payload: error.response.data.Message,
    });
  }
};

////////////////////////////////  FORGOT PASSWORD ACTION ///////////////////////////////////////////////////

export const forgotPassword = (email) => async (dispatch) => {
  try {
    dispatch({ type: FORGOT_PASSWORD_REQUEST });
    const config = {
      headers: {
        "content-Type": "application/json",
      },
    };
    const { data } = await axios.post(`/api/v1/password/forgot`, email, config);
    dispatch({ type: FORGOT_PASSWORD_SUCCESS, payload: data.message });
  } catch (error) {
    dispatch({
      type: FORGOT_PASSWORD_FAIL,
      payload: error.response.data.Message,
    });
  }
};

////////////////////////////////  RESET PASSWORD ACTION ///////////////////////////////////////////////////

export const resetPassword = (token, passwords) => async (dispatch) => {
  try {
    dispatch({ type: NEW_PASSWORD_REQUEST });
    const config = {
      headers: {
        "content-Type": "application/json",
      },
    };
    const { data } = await axios.put(
      `/api/v1/password/reset/${token}`,
      passwords,
      config
    );
    dispatch({ type: NEW_PASSWORD_SUCCESS, payload: data.success });
  } catch (error) {
    dispatch({
      type: NEW_PASSWORD_FAIL,
      payload: error.response.data.Message,
    });
  }
};

//////////////////////////////////////////////////////////////////////////////////

////// CART ///////

//////////////////////////////////////////////////////////////////////////////////

////////////////////////////////  ADD TO CART ACTION //////////////////////////////

export const addItemToCart = (id, quantity) => async (dispatch, getState) => {
  const { data } = await axios.get(`/api/v1/product/${id}`);

  dispatch({
    type: ADD_TO_CART,
    payload: {
      product: data.product._id,
      name: data.product.name,
      price: data.product.price,
      stock: data.product.stock,
      image: data.product.images[0].url,
      quantity,
    },
  });

  localStorage.setItem("cartItems", JSON.stringify(getState().cart.cartItems));
};

////////////////////////////////  REMOVE ITEM FROM CART ACTION //////////////////////////////

export const removeItemFromCart = (id) => async (dispatch, getState) => {
  dispatch({
    type: REMOVE_ITEM_CART,
    payload: id,
  });

  localStorage.setItem("cartItems", JSON.stringify(getState().cart.cartItems));
};

////////////////////////////////  SHIPPING INFO ACTION //////////////////////////////

export const saveShippingInfo = (data) => async (dispatch) => {
  dispatch({
    type: SAVE_SHIPPING_INFO,
    payload: data,
  });

  localStorage.setItem("shippingInfo", JSON.stringify(data));
};

//////////////////////////////////////////////////////////////////////////////////

////// ORDERS ///////

//////////////////////////////////////////////////////////////////////////////////

////////////////////////////////  NEW ORDER ACTION //////////////////////////////

export const createOrder = (order) => async (dispatch, getstate) => {
  try {
    dispatch({ type: CREATE_ORDER_REQUEST });
    const config = {
      headers: {
        "content-Type": "application/json",
      },
    };

    const { data } = await axios.post(`api/v1/order/new`, order, config);
    dispatch({
      type: CREATE_ORDER_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({ type: CREATE_ORDER_FAIL, error: error.response.data.Message });
  }
};

////////////////////////////////  MY ORDERS ACTION //////////////////////////////

export const myAllOrders = () => async (dispatch) => {
  try {
    dispatch({ type: MY_ORDERS_REQUEST });

    const { data } = await axios.get(`/api/v1/order/me`);
    dispatch({
      type: MY_ORDERS_SUCCESS,
      payload: data.order,
    });
  } catch (error) {
    dispatch({
      type: MY_ORDERS_FAIL,
      payload: error.response.data.Message,
    });
  }
};

////////////////////////////////  GET ORDER DETAILS ACTION //////////////////////////////

export const getOrderDetails = (id) => async (dispatch) => {
  try {
    dispatch({ type: ORDER_DETAILS_REQUEST });

    const { data } = await axios.get(`/api/v1/order/${id}`);

    dispatch({
      type: ORDER_DETAILS_SUCCESS,
      payload: data.order,
    });
  } catch (error) {
    dispatch({
      type: ORDER_DETAILS_FAIL,
      payload: error.response.data.Message,
    });
  }
};

//////////////////////////////////////////////////////////////////////////////////

////// ADMIN ROUTES ///////

//////////////////////////////////////////////////////////////////////////////////

////////////////////////////////  GET ALL PRODUCTS ACTION //////////////////////////////

export const getAdminProducts = () => async (dispatch) => {
  try {
    dispatch({
      type: ADMIN_PRODUCT_REQUEST,
    });
    const { data } = await axios.get(`/api/v1/admin/products`);
    dispatch({ type: ADMIN_PRODUCT_SUCCESS, payload: data.products });
  } catch (error) {
    dispatch({
      type: ADMIN_PRODUCT_FAIL,
      payload: error.response.data.Message,
    });
  }
};

//////////////////////////////// CREATE NEW PRODUCT ACTION //////////////////////////////

export const newProduct = (productData) => async (dispatch) => {
  try {
    dispatch({
      type: NEW_PRODUCT_REQUEST,
    });

    const config = {
      headers: {
        "content-Type": "application/json",
      },
    };

    const { data } = await axios.post(
      `/api/v1/admin/products/new`,
      productData,
      config
    );

    dispatch({ type: NEW_PRODUCT_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: NEW_PRODUCT_FAIL,
      payload: error.response.data.message,
    });
  }
};

//////////////////////////////// Delete PRODUCT ACTION //////////////////////////////

export const deleteProduct = (id) => async (dispatch) => {
  try {
    dispatch({
      type: DELETE_PRODUCT_REQUEST,
    });

    const { data } = await axios.delete(`/api/v1/admin/product/${id}`);

    dispatch({ type: DELETE_PRODUCT_SUCCESS, payload: data.success });
  } catch (error) {
    dispatch({
      type: DELETE_PRODUCT_FAIL,
      payload: error.response.data.message,
    });
  }
};

//////////////////////////////// UPDATE PRODUCT ACTION //////////////////////////////

export const updateProduct = (id, productData) => async (dispatch) => {
  try {
    dispatch({
      type: UPDATE_PRODUCT_REQUEST,
    });

    const config = {
      headers: {
        "content-Type": "application/json",
      },
    };

    const { data } = await axios.put(
      `/api/v1/admin/product/${id}`,
      productData,
      config
    );

    dispatch({ type: UPDATE_PRODUCT_SUCCESS, payload: data.success });
  } catch (error) {
    dispatch({
      type: UPDATE_PRODUCT_FAIL,
      payload: error.response.data.message,
    });
  }
};

//////////////////////////////// ALL ORDER ACTION (DASHBOARD) //////////////////////////////

export const allOrders = () => async (dispatch) => {
  try {
    dispatch({ type: ALL_ORDERS_REQUEST });

    const { data } = await axios.get(`/api/v1/admin/orderS`);

    dispatch({
      type: ALL_ORDERS_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ALL_ORDERS_FAIL,
      payload: error.response.data.Message,
    });
  }
};

//////////////////////////////// UPDATE ORDER ACTION (DASHBOARD) //////////////////////////////

export const updateOrder = (id, orderData) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_ORDER_REQUEST });
    const config = {
      headers: {
        "content-Type": "application/json",
      },
    };

    const { data } = await axios.put(
      `/api/v1/admin/order/${id}`,
      orderData,
      config
    );
    dispatch({
      type: UPDATE_ORDER_SUCCESS,
      payload: data.success,
    });
  } catch (error) {
    dispatch({ type: UPDATE_ORDER_FAIL, payload: error.response.data.Message });
  }
};

//////////////////////////////// DELETE ORDER ACTION (DASHBOARD) //////////////////////////////

export const deleteOrder = (id) => async (dispatch) => {
  try {
    dispatch({ type: DELETE_ORDER_REQUEST });

    const { data } = await axios.delete(`/api/v1/admin/order/${id}`);

    dispatch({ type: DELETE_ORDER_SUCCESS, payload: data.success });
  } catch (error) {
    dispatch({ type: DELETE_ORDER_FAIL, payload: error.response.data.Message });
  }
};

//////////////////////////////// ALL USERS ORDER ACTION (DASHBOARD) //////////////////////////////

export const allUsers = () => async (dispatch) => {
  try {
    dispatch({ type: ALL_USERS_REQUEST });

    const { data } = await axios.get(`/api/v1/admin/users`);
    dispatch({ type: ALL_USERS_SUCCESS, payload: data.users });
    console.log(data);
  } catch (error) {
    dispatch({
      type: ALL_USERS_FAIL,
      payload: error.response.data.Message,
    });
  }
};

//////////////////////////////// UPDATE USER ORDER ACTION (DASHBOARD) //////////////////////////////

export const updateUser = (id, userData) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_USER_REQUEST });
    const config = {
      headers: {
        "content-Type": "application/json",
      },
    };
    const { data } = await axios.put(
      `/api/v1/admin/user/${id}`,
      userData,
      config
    );
    dispatch({ type: UPDATE_USER_SUCCESS, payload: data.success });
  } catch (error) {
    dispatch({
      type: UPDATE_USER_FAIL,
      payload: error.response.data.Message,
    });
  }
};

//////////////////////////////// GET USER DETAILS ORDER ACTION (DASHBOARD) //////////////////////////////

export const getUserDetails = (id) => async (dispatch) => {
  try {
    dispatch({ type: USER_DETAILS_REQUEST });

    const { data } = await axios.get(`/api/v1/admin/user/${id}`);
    dispatch({ type: USER_DETAILS_SUCCESS, payload: data.user });
  } catch (error) {
    dispatch({
      type: USER_DETAILS_FAIL,
      payload: error.response.data.Message,
    });
  }
};

// CLEAR ALL ERRORS

export const clearError = () => async (dispatch) => {
  dispatch({
    type: CLEAR_ERRORS,
  });
};
