import { configureStore } from "@reduxjs/toolkit";
import reducers from "./reducers";
const readStorage = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(fallback)
      ? Array.isArray(value)
        ? value
        : fallback
      : value && typeof value === "object" && !Array.isArray(value)
        ? value
        : fallback;
  } catch {
    return fallback;
  }
};
export const makeStore = (preloadedState) =>
  configureStore({ reducer: reducers, preloadedState });
export const store = makeStore({
  cart: {
    cartItems: readStorage("cartItems", []),
    shippingInfo: readStorage("shippingInfo", {}),
  },
});
