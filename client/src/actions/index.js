import { queryClient, productOptions } from "../queries/products";
import axios from "axios";

//PRODUCT CONSTANTS
import {
  GET_REVIEWS_REQUEST,
  GET_REVIEWS_SUCCESS,
  GET_REVIEWS_FAIL,
  DELETE_REVIEW_REQUEST,
  DELETE_REVIEW_SUCCESS,
  DELETE_REVIEW_FAIL,
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
  DELETE_USER_REQUEST,
  DELETE_USER_SUCCESS,
  DELETE_USER_FAIL,
} from "../constants/userConstants";

// CART CONSTANTS

import { ADD_TO_CART, REMOVE_ITEM_CART, SET_CART_ITEMS } from "../constants/cartConstants";

// SHIPPING CONSTANTS

import { SAVE_SHIPPING_INFO, SET_SAVED_SHIPPING } from "../constants/shippingConstants";

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

const errorMessage = error => error.response?.data?.Message || error.response?.data?.message || error.message || "Request failed. Please try again.";

// get all product on the Home screen

// Get detail of the product by clicking it


//////////////////////////////////////////////////////////////////////////////////

////// REVIEWS ///////

//////////////////////////////////////////////////////////////////////////////////

//////////////////////////////// CREATE NEW REVIEW ACTION ///////////////////////////////////////////////////

// NEW REVIEW


//////////////////////////////////////////////////////////////////////////////////

////// AUTHORIZATION (REGISTRATION, LOGIN , LOGOUT) ///////

//////////////////////////////////////////////////////////////////////////////////

////////////////////////////////  AUTHORIZATION ACTION ///////////////////////////////////////////////////

export const login = (email, password) => async (dispatch) => {
  try {
    dispatch({ type: LOGIN_REQUEST });
    const config = {};
    const { data } = await axios.post(
      `/api/v1/login`,
      { email, password },
      config
    );
    dispatch({ type: LOGIN_SUCCESS, payload: data.user });
    dispatch(syncAccount()); // UPDATED: merge guest cart + load account cart/address
  } catch (error) {
    dispatch({
      type: LOGIN_FAIL,
      payload: errorMessage(error),
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
    dispatch(syncAccount()); // UPDATED
  } catch (error) {
    dispatch({
      type: REGISTER_USER_FAIL,
      payload: errorMessage(error),
    });
  }
};

////////////////////  LOAD USER ACTION  (CONSIST LOGIN) /////////////////////

export const loadUser = () => async (dispatch) => {
  try {
    dispatch({ type: LOAD_USER_REQUEST });

    const { data } = await axios.get(`/api/v1/me`);
    dispatch({ type: LOAD_USER_SUCCESS, payload: data.user });
    dispatch(syncAccount()); // UPDATED
  } catch (error) {
    dispatch({
      type: LOAD_USER_FAIL,
      payload: error.response?.status === 401 ? null : errorMessage(error),
    });
  }
};

////////////////////  LOGOUT USER ACTION  /////////////////////

export const logout = () => async (dispatch) => {
  try {
    await axios.get(`/api/v1/logout`);
    queryClient.clear();
    // UPDATED: the account cart/address stay in MongoDB; the browser starts a fresh, empty guest session
    localStorage.removeItem(GUEST_CART);
    localStorage.removeItem(GUEST_SHIPPING);
    localStorage.removeItem(MERGE_ID);
    sessionStorage.removeItem("lastOrderId"); // UPDATED
    dispatch({ type: LOGOUT_SUCCESS });
    return true;
  } catch (error) {
    dispatch({
      type: LOGOUT_FAIL,
      payload: errorMessage(error),
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
      payload: errorMessage(error),
    });
  }
};

////////////////////////////////  UPDATE PASSWORD ACTION ///////////////////////////////////////////////////

export const updatePassword = (passwords) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_PASSWORD_REQUEST });
    const config = {};
    const { data } = await axios.put(
      `/api/v1/password/update`,
      passwords,
      config
    );
    dispatch({ type: UPDATE_PASSWORD_SUCCESS, payload: data.success });
  } catch (error) {
    dispatch({
      type: UPDATE_PASSWORD_FAIL,
      payload: errorMessage(error),
    });
  }
};

////////////////////////////////  FORGOT PASSWORD ACTION ///////////////////////////////////////////////////

export const forgotPassword = (email) => async (dispatch) => {
  try {
    dispatch({ type: FORGOT_PASSWORD_REQUEST });
    const config = {};
    const { data } = await axios.post(`/api/v1/password/forgot`, email, config);
    dispatch({ type: FORGOT_PASSWORD_SUCCESS, payload: data.message });
  } catch (error) {
    dispatch({
      type: FORGOT_PASSWORD_FAIL,
      payload: errorMessage(error),
    });
  }
};

////////////////////////////////  RESET PASSWORD ACTION ///////////////////////////////////////////////////

export const resetPassword = (token, passwords) => async (dispatch) => {
  try {
    dispatch({ type: NEW_PASSWORD_REQUEST });
    const config = {};
    const { data } = await axios.put(
      `/api/v1/password/reset/${token}`,
      passwords,
      config
    );
    dispatch({ type: NEW_PASSWORD_SUCCESS, payload: data.success });
  } catch (error) {
    dispatch({
      type: NEW_PASSWORD_FAIL,
      payload: errorMessage(error),
    });
  }
};

//////////////////////////////////////////////////////////////////////////////////

////// CART ///////

//////////////////////////////////////////////////////////////////////////////////

////////////////////////////////  ADD TO CART ACTION //////////////////////////////

// UPDATED: guests keep the cart/address in localStorage; signed-in users use the MongoDB account cart
// (the browser never stores a signed-in user's cart, so logout leaves nothing private behind).
const GUEST_CART = "cartItems";
const GUEST_SHIPPING = "shippingInfo";
const MERGE_ID = "cartMergeId";
const signedIn = (getState) => Boolean(getState().auth && getState().auth.user);
const readLocal = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
};
const hasAddress = (info) => Boolean(info && info.address);
const setCart = (data) => ({ type: SET_CART_ITEMS, payload: data.cartItems });

export const addItemToCart = (id, quantity) => async (dispatch, getState) => {
  if (signedIn(getState)) {
    const { data } = await axios.put("/api/v1/cart/items", { productId: id, quantity });
    dispatch(setCart(data));
    return;
  }
  const product = await queryClient.fetchQuery({ ...productOptions(id), staleTime: 0 });

  dispatch({
    type: ADD_TO_CART,
    payload: {
      product: product._id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      image: product.images[0].url,
      quantity,
    },
  });

  localStorage.setItem(GUEST_CART, JSON.stringify(getState().cart.cartItems));
};

////////////////////////////////  REMOVE ITEM FROM CART ACTION //////////////////////////////

export const removeItemFromCart = (id) => async (dispatch, getState) => {
  if (signedIn(getState)) {
    const { data } = await axios.delete(`/api/v1/cart/items/${id}`);
    dispatch(setCart(data));
    return;
  }
  dispatch({
    type: REMOVE_ITEM_CART,
    payload: id,
  });

  localStorage.setItem(GUEST_CART, JSON.stringify(getState().cart.cartItems));
};

// UPDATED: re-reads the account cart (e.g. after the server removed purchased items). Never throws.
export const loadCart = () => async (dispatch) => {
  try {
    const { data } = await axios.get("/api/v1/cart");
    dispatch(setCart(data));
  } catch {
    // keep what is shown; the next sync corrects it
  }
};

// UPDATED: runs after login/register/loadUser. Merges the guest cart once (the mergeId is kept until
// the server confirms, so a retry is not applied twice), then loads the account cart and saved address.
// Concurrent calls (login + loadUser) share one run.
let accountSync = null;
export const syncAccount = () => (dispatch) => {
  if (accountSync) return accountSync;
  accountSync = (async () => {
    try {
      const guest = readLocal(GUEST_CART);
      const items = (Array.isArray(guest) ? guest : [])
        .filter((item) => item && typeof item.product === "string" && Number.isSafeInteger(item.quantity) && item.quantity > 0)
        .map(({ product, quantity }) => ({ product, quantity: Math.min(quantity, 99) }));
      let response;
      if (items.length) {
        let mergeId = localStorage.getItem(MERGE_ID);
        if (!mergeId) {
          mergeId = Array.from(window.crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join("");
          localStorage.setItem(MERGE_ID, mergeId);
        }
        response = await axios.post("/api/v1/cart/merge", { mergeId, items });
        localStorage.removeItem(GUEST_CART);
        localStorage.removeItem(MERGE_ID);
      } else {
        response = await axios.get("/api/v1/cart");
      }
      dispatch(setCart(response.data));

      const { data } = await axios.get("/api/v1/me/shipping");
      const guestAddress = readLocal(GUEST_SHIPPING);
      dispatch({ type: SET_SAVED_SHIPPING, payload: data.shippingInfo || null });
      // A guest address is shown for review on the Shipping page; it is saved only when the user continues.
      dispatch({ type: SAVE_SHIPPING_INFO, payload: hasAddress(guestAddress) ? guestAddress : data.shippingInfo || {} });
      localStorage.removeItem(GUEST_SHIPPING);
    } catch {
      // Guest data stays in localStorage and is merged on the next successful sync.
    } finally {
      accountSync = null;
    }
  })();
  return accountSync;
};

////////////////////////////////  SHIPPING INFO ACTION //////////////////////////////

// UPDATED: signed-in users save the address on their account (validated by the server)
export const saveShippingInfo = (data) => async (dispatch, getState) => {
  if (signedIn(getState)) {
    const response = await axios.put("/api/v1/me/shipping", data);
    dispatch({ type: SET_SAVED_SHIPPING, payload: response.data.shippingInfo });
    dispatch({ type: SAVE_SHIPPING_INFO, payload: response.data.shippingInfo });
    return;
  }
  dispatch({
    type: SAVE_SHIPPING_INFO,
    payload: data,
  });

  localStorage.setItem(GUEST_SHIPPING, JSON.stringify(data));
};

//////////////////////////////////////////////////////////////////////////////////

////// ORDERS ///////

//////////////////////////////////////////////////////////////////////////////////

////////////////////////////////  NEW ORDER ACTION //////////////////////////////

export const createOrder = (order) => async (dispatch) => {
  try {
    dispatch({ type: CREATE_ORDER_REQUEST });
    const config = {};

    const { data } = await axios.post(`/api/v1/order/new`, order, config);
    dispatch({
      type: CREATE_ORDER_SUCCESS,
      payload: data,
    });
    return data.order;
  } catch (error) {
    dispatch({ type: CREATE_ORDER_FAIL, payload: error.response?.data?.Message || error.message || "Unable to create order" });
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
      payload: errorMessage(error),
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
      payload: errorMessage(error),
    });
  }
};

//////////////////////////////////////////////////////////////////////////////////

////// ADMIN ROUTES ///////

//////////////////////////////////////////////////////////////////////////////////

////////////////////////////////  GET ALL PRODUCTS ACTION //////////////////////////////


//////////////////////////////// CREATE NEW PRODUCT ACTION //////////////////////////////

export const newProduct = (productData) => async (dispatch) => {
  try {
    dispatch({
      type: NEW_PRODUCT_REQUEST,
    });

    const config = {};

    const { data } = await axios.post(
      `/api/v1/admin/products/new`,
      productData,
      config
    );

    dispatch({ type: NEW_PRODUCT_SUCCESS, payload: data });
    await queryClient.invalidateQueries({ queryKey: ["products"] });
  } catch (error) {
    dispatch({
      type: NEW_PRODUCT_FAIL,
      payload: errorMessage(error),
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
    await queryClient.invalidateQueries({ queryKey: ["products"] });
  } catch (error) {
    dispatch({
      type: DELETE_PRODUCT_FAIL,
      payload: errorMessage(error),
    });
  }
};

//////////////////////////////// UPDATE PRODUCT ACTION //////////////////////////////

export const updateProduct = (id, productData) => async (dispatch) => {
  try {
    dispatch({
      type: UPDATE_PRODUCT_REQUEST,
    });

    const config = {};

    const { data } = await axios.put(
      `/api/v1/admin/product/${id}`,
      productData,
      config
    );

    dispatch({ type: UPDATE_PRODUCT_SUCCESS, payload: data.success });
    await queryClient.invalidateQueries({ queryKey: ["products"] });
  } catch (error) {
    dispatch({
      type: UPDATE_PRODUCT_FAIL,
      payload: errorMessage(error),
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
      payload: errorMessage(error),
    });
  }
};

//////////////////////////////// UPDATE ORDER ACTION (DASHBOARD) //////////////////////////////

export const updateOrder = (id, orderData) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_ORDER_REQUEST });
    const config = {};

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
    dispatch({ type: UPDATE_ORDER_FAIL, payload: errorMessage(error) });
  }
};

//////////////////////////////// DELETE ORDER ACTION (DASHBOARD) //////////////////////////////

export const deleteOrder = (id) => async (dispatch) => {
  try {
    dispatch({ type: DELETE_ORDER_REQUEST });

    const { data } = await axios.delete(`/api/v1/admin/order/${id}`);

    dispatch({ type: DELETE_ORDER_SUCCESS, payload: data.success });
  } catch (error) {
    dispatch({ type: DELETE_ORDER_FAIL, payload: errorMessage(error) });
  }
};

//////////////////////////////// ALL USERS ORDER ACTION (DASHBOARD) //////////////////////////////

export const allUsers = () => async (dispatch) => {
  try {
    dispatch({ type: ALL_USERS_REQUEST });

    const { data } = await axios.get(`/api/v1/admin/users`);
    dispatch({ type: ALL_USERS_SUCCESS, payload: data.users });
  } catch (error) {
    dispatch({
      type: ALL_USERS_FAIL,
      payload: errorMessage(error),
    });
  }
};

//////////////////////////////// UPDATE USER ORDER ACTION (DASHBOARD) //////////////////////////////

export const updateUser = (id, userData) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_USER_REQUEST });
    const config = {};
    const { data } = await axios.put(
      `/api/v1/admin/user/${id}`,
      userData,
      config
    );
    dispatch({ type: UPDATE_USER_SUCCESS, payload: data.success });
  } catch (error) {
    dispatch({
      type: UPDATE_USER_FAIL,
      payload: errorMessage(error),
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
      payload: errorMessage(error),
    });
  }
};

//////////////////////////////// DELETE USER ORDER ACTION (DASHBOARD) //////////////////////////////

export const deleteUser = (id) => async (dispatch) => {
  try {
    dispatch({ type: DELETE_USER_REQUEST });

    const { data } = await axios.delete(`/api/v1/admin/user/${id}`);
    dispatch({ type: DELETE_USER_SUCCESS, payload: data.success });
  } catch (error) {
    dispatch({
      type: DELETE_USER_FAIL,
      payload: errorMessage(error),
    });
  }
};

//////////////////////////////// GET ALL REVIEWS ACTION (DASHBOARD) //////////////////////////////

export const getProductReviews = (id) => async (dispatch) => {
  try {
    dispatch({ type: GET_REVIEWS_REQUEST });

    const { data } = await axios.get(`/api/v1/reviews?id=${id}`);
    dispatch({ type: GET_REVIEWS_SUCCESS, payload: data.reviews });
  } catch (error) {
    dispatch({
      type: GET_REVIEWS_FAIL,
      payload: errorMessage(error),
    });
  }
};

//////////////////////////////// DELETE REVIEWS ACTION (DASHBOARD) //////////////////////////////

export const deleteReview = (id, productId) => async (dispatch) => {
  try {
    dispatch({ type: DELETE_REVIEW_REQUEST });

    const { data } = await axios.delete(
      `/api/v1/reviews?id=${id}&productId=${productId}`
    );
    dispatch({ type: DELETE_REVIEW_SUCCESS, payload: data.success });
    await queryClient.invalidateQueries({ queryKey: ["products"] });
  } catch (error) {
    dispatch({
      type: DELETE_REVIEW_FAIL,
      payload: errorMessage(error),
    });
  }
};

// CLEAR ALL ERRORS

export const clearError = () => async (dispatch) => {
  dispatch({
    type: CLEAR_ERRORS,
  });
};

// UPDATED: removes the saved default address from the account (Profile page)
export const deleteShippingInfo = () => async (dispatch) => {
  await axios.delete("/api/v1/me/shipping");
  dispatch({ type: SET_SAVED_SHIPPING, payload: null });
  dispatch({ type: SAVE_SHIPPING_INFO, payload: {} });
};
