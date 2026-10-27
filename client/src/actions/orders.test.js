import axios from "axios";
import { configureStore } from "@reduxjs/toolkit";
import { createOrder } from "./index";
import orderReducer from "../reducers/Orders/OrderReducers";

jest.mock("axios");

const makeStore = () => configureStore({ reducer: { newOrder: orderReducer } });

test("order request transitions loading to successful order", async () => {
  let finish;
  axios.post.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const store = makeStore();
  const request = store.dispatch(createOrder({ orderItems: [] }));
  expect(store.getState().newOrder.loading).toBe(true);
  finish({ data: { success: true, order: { _id: "order-a" } } });
  await request;
  expect(store.getState().newOrder.loading).toBe(false);
  expect(store.getState().newOrder.order.order._id).toBe("order-a");
});

test("server rejection is available to the checkout UI", async () => {
  axios.post.mockRejectedValue({ response: { data: { Message: "Payment not verified" } } });
  const store = makeStore();
  await store.dispatch(createOrder({}));
  expect(store.getState().newOrder).toMatchObject({ loading: false, error: "Payment not verified" });
});

test("offline request finishes loading and exposes an error without throwing", async () => {
  axios.post.mockRejectedValue(new Error("Network Error"));
  const store = makeStore();
  await expect(store.dispatch(createOrder({}))).resolves.toBeUndefined();
  expect(store.getState().newOrder.loading).toBe(false);
  expect(store.getState().newOrder.error).toEqual(expect.any(String));
  expect(store.getState().newOrder.error.length).toBeGreaterThan(0);
});
