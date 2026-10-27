import axios from "axios";
import { makeStore } from "../store";
import { addItemToCart, removeItemFromCart, saveShippingInfo } from "./index";
import { queryClient } from "../queries/products";
jest.mock("axios");
afterEach(() => {localStorage.clear(); queryClient.clear();});
test("cart uses current server product, updates quantity without duplicates and persists shipping/removal", async () => {
  axios.get.mockResolvedValue({data:{product:{_id:"one",name:"Camera",price:50,stock:4,images:[{url:"/camera.jpg"}]}}});
  const store = makeStore();
  await store.dispatch(addItemToCart("one",1)); await store.dispatch(addItemToCart("one",2));
  expect(store.getState().cart.cartItems).toHaveLength(1); expect(store.getState().cart.cartItems[0].quantity).toBe(2);
  expect(JSON.parse(localStorage.getItem("cartItems"))[0].price).toBe(50);
  await store.dispatch(saveShippingInfo({city:"Berlin"})); expect(store.getState().cart.shippingInfo.city).toBe("Berlin");
  await store.dispatch(removeItemFromCart("one")); expect(JSON.parse(localStorage.getItem("cartItems"))).toEqual([]);
});
test("failed product fetch leaves existing cart intact", async () => {
  const store = makeStore(); axios.get.mockRejectedValue(new Error("Offline"));
  await expect(store.dispatch(addItemToCart("one",1))).rejects.toThrow("Offline"); expect(store.getState().cart.cartItems).toEqual([]);
});
