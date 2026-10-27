import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import axios from "axios";
import { useStripe, useElements } from "@stripe/react-stripe-js";
import orderReducer from "../../reducers/Orders/OrderReducers";
import Payment from "./Payment";

jest.mock("axios");
jest.mock("../ui/Alerts", () => ({ useAlert: () => ({ error: jest.fn() }) }));
jest.mock("../layouts/MetaDAta", () => () => null);
jest.mock("./CheckoutSteps", () => () => null);
jest.mock("@stripe/react-stripe-js", () => ({
  useStripe: jest.fn(), useElements: jest.fn(),
  CardNumberElement: () => null, CardExpiryElement: () => null, CardCvcElement: () => null,
}));

jest.mock("react-router-dom", () => ({ useNavigate: jest.fn() }));

function checkout(history) {
  require("react-router-dom").useNavigate.mockReturnValue(history.push);
  const state = {
    auth: { user: { name: "Buyer", email: "buyer@example.test" } },
    cart: { cartItems: [{ product: "p", quantity: 1, price: 100 }], shippingInfo: {} },
    newOrder: {},
  };
  const store = configureStore({ reducer: (current = state, action) => ({ ...current, newOrder: orderReducer(current.newOrder, action) }) });
  return render(<Provider store={store}><Payment history={history} /></Provider>);
}

beforeEach(() => {
  sessionStorage.clear();
  Object.defineProperty(window, "crypto", { configurable: true, value: { getRandomValues: values => require("crypto").randomFillSync(values) } });
  useStripe.mockReturnValue({ confirmCardPayment: jest.fn().mockResolvedValue({ paymentIntent: { id: "pi_test", status: "succeeded" } }) });
  useElements.mockReturnValue({ getElement: jest.fn().mockReturnValue({}) });
});
afterEach(() => { sessionStorage.clear(); jest.restoreAllMocks(); });

test("opening payment without checkout session does not crash or charge", () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  expect(() => checkout({ push: jest.fn() })).not.toThrow();
  expect(axios.post).not.toHaveBeenCalled();
});

test("success navigation waits for order persistence after payment", async () => {
  sessionStorage.setItem("orderInfo", JSON.stringify({ itemsPrice: 100, taxPrice: 5, shippingPrice: 25, totalPrice: 130 }));
  let finishOrder;
  axios.post.mockImplementation(url => {
    if (url.includes("payment/process")) return Promise.resolve({ data: { client_secret: "test-only", paymentIntentId: "pi_test", status: "requires_payment_method", totalPrice: 130 } });
    return new Promise(resolve => { finishOrder = resolve; });
  });
  const history = { push: jest.fn() };
  checkout(history);
  await act(async () => { fireEvent.submit(screen.getByRole("button", { name: /Pay/ }).closest("form")); });
  const navigatedEarly = history.push.mock.calls.some(([path]) => path === "/success");
  expect(finishOrder).toEqual(expect.any(Function));
  await act(async () => { finishOrder({ data: { success: true, order: { _id: "order-a" } } }); });
  expect(navigatedEarly).toBe(false);
  expect(history.push).toHaveBeenCalledWith("/success");
});

test("order save failure can retry without a second payment", async () => {
  sessionStorage.setItem("orderInfo", JSON.stringify({ totalPrice: 130 }));
  let orderCalls = 0;
  axios.post.mockImplementation(url => {
    if (url.includes("payment/process")) return Promise.resolve({ data: { client_secret: "test", paymentIntentId: "pi_test", status: "requires_payment_method", totalPrice: 130 } });
    orderCalls++;
    if (orderCalls === 1) return Promise.reject({ response: { data: { Message: "Database unavailable" } } });
    return Promise.resolve({ data: { success: true, order: { _id: "order-a" } } });
  });
  const history = { push: jest.fn() };
  checkout(history);
  await act(async () => { fireEvent.submit(screen.getByRole("button", { name: /Pay/ }).closest("form")); });
  expect(history.push).not.toHaveBeenCalled();
  expect(JSON.parse(sessionStorage.getItem("pendingCheckout")).paid).toBe(true);
  await act(async () => { fireEvent.submit(screen.getByRole("button", { name: /Retry order confirmation/ }).closest("form")); });
  expect(history.push).toHaveBeenCalledWith("/success");
  expect(useStripe().confirmCardPayment).toHaveBeenCalledTimes(1);
  expect(axios.post.mock.calls.filter(([url]) => url.includes("payment/process"))).toHaveLength(1);
});

test("changed server total requires confirmation before charging", async () => {
  sessionStorage.setItem("orderInfo", JSON.stringify({ totalPrice: 100 }));
  axios.post.mockResolvedValue({ data: { client_secret: "test", paymentIntentId: "pi_test", status: "requires_payment_method", totalPrice: 130 } });
  checkout({ push: jest.fn() });
  await act(async () => { fireEvent.submit(screen.getByRole("button", { name: /Pay/ }).closest("form")); });
  expect(useStripe().confirmCardPayment).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: /130/ })).toBeTruthy();
  expect(screen.getByText(/latest order total/)).toBeTruthy();
});
