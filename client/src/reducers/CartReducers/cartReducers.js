import { createSlice } from "@reduxjs/toolkit";
import { ADD_TO_CART, REMOVE_ITEM_CART } from "../../constants/cartConstants";
import { SAVE_SHIPPING_INFO } from "../../constants/shippingConstants";
import { LOGOUT_SUCCESS } from "../../constants/authConstants";
const cart = createSlice({
  name: "cart",
  initialState: { cartItems: [], shippingInfo: {} },
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
      // UPDATED: logout clears the cart (localStorage is cleared in the action)
      .addCase(LOGOUT_SUCCESS, () => ({ cartItems: [], shippingInfo: {} }));
  },
});
export default cart.reducer;
