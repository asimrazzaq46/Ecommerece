import { createSlice } from "@reduxjs/toolkit";
import { ADD_TO_CART, REMOVE_ITEM_CART, SET_CART_ITEMS } from "../../constants/cartConstants";
import { SAVE_SHIPPING_INFO, SET_SAVED_SHIPPING } from "../../constants/shippingConstants";
import { LOGOUT_SUCCESS } from "../../constants/authConstants";
const cart = createSlice({
  name: "cart",
  initialState: { cartItems: [], shippingInfo: {}, savedShippingInfo: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(ADD_TO_CART, (state, { payload }) => {
        const index = state.cartItems.findIndex(
          (item) => item.product === payload.product,
        );
        if (index < 0) state.cartItems.push(payload);
        else state.cartItems[index] = payload;
      })
      .addCase(REMOVE_ITEM_CART, (state, { payload }) => {
        state.cartItems = state.cartItems.filter(
          (item) => item.product !== payload,
        );
      })
      .addCase(SAVE_SHIPPING_INFO, (state, { payload }) => {
        state.shippingInfo = payload;
      })
      // UPDATED: server-backed cart and saved address
      .addCase(SET_CART_ITEMS, (state, { payload }) => {
        state.cartItems = payload;
      })
      .addCase(SET_SAVED_SHIPPING, (state, { payload }) => {
        state.savedShippingInfo = payload;
      })
      // UPDATED: logout empties the browser copy; the account cart stays in MongoDB
      .addCase(LOGOUT_SUCCESS, () => ({ cartItems: [], shippingInfo: {}, savedShippingInfo: null }));
  },
});
export default cart.reducer;
