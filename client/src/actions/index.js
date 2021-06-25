import axios from "axios";

//PRODUCT CONSTANTS
import {
  ALL_PRODUCT_REQUEST,
  ALL_PRODUCT_SUCCESS,
  ALL_PRODUCT_FAIL,
  PRODUCT_DETAILS_REQUEST,
  PRODUCT_DETAILS_SUCCESS,
  PRODUCT_DETAILS_FAIL,
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
    console.log("orders in action", data.order);
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
    console.log("orders in action", data.order);
  } catch (error) {
    dispatch({
      type: ORDER_DETAILS_FAIL,
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
