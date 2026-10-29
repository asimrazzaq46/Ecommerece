// UPDATED: guest/account cart synchronisation (Redux actions + localStorage)
import axios from "axios";
import { makeStore } from "../store";
import { syncAccount, addItemToCart, removeItemFromCart, logout, saveShippingInfo } from "./index";

jest.mock("axios");
jest.mock("../queries/products", () => ({
  queryClient: { clear: jest.fn(), fetchQuery: jest.fn() },
  productOptions: (id) => ({ queryKey: ["p", id] }),
}));

const P1 = "507f1f77bcf86cd799439012";
const serverCart = [{ product: P1, name: "Bag", price: 10, image: "/b.png", stock: 5, quantity: 3 }];
const signedInStore = () =>
  makeStore({ auth: { user: { _id: "u1" }, isAuthenticated: true }, cart: { cartItems: [], shippingInfo: {}, savedShippingInfo: null } });

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(window, "crypto", { configurable: true, value: { getRandomValues: (v) => require("crypto").randomFillSync(v) } });
  axios.get.mockImplementation(async (url) =>
    url.includes("/me/shipping") ? { data: { shippingInfo: { address: "Saved 1", city: "Rome" } } } : { data: { cartItems: serverCart } },
  );
});

test("login merges the guest cart once and clears it only after the server confirms", async () => {
  localStorage.setItem("cartItems", JSON.stringify([{ product: P1, quantity: 2, name: "Bag", price: 10 }]));
  axios.post.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ data: { cartItems: serverCart } });
  const store = signedInStore();

  await store.dispatch(syncAccount());
  expect(localStorage.getItem("cartItems")).not.toBeNull(); // kept for retry
  const firstId = axios.post.mock.calls[0][1].mergeId;

  await store.dispatch(syncAccount());
  expect(axios.post.mock.calls[1][1]).toEqual({ mergeId: firstId, items: [{ product: P1, quantity: 2 }] }); // same id → idempotent
  expect(localStorage.getItem("cartItems")).toBeNull();
  expect(store.getState().cart.cartItems).toEqual(serverCart);
});

test("a guest address is offered for review instead of replacing the saved one", async () => {
  localStorage.setItem("shippingInfo", JSON.stringify({ address: "Guest 9", city: "Milan" }));
  const store = signedInStore();
  await store.dispatch(syncAccount());
  expect(store.getState().cart.savedShippingInfo).toEqual({ address: "Saved 1", city: "Rome" });
  expect(store.getState().cart.shippingInfo).toEqual({ address: "Guest 9", city: "Milan" });
  expect(localStorage.getItem("shippingInfo")).toBeNull();
});

test("signed-in cart changes go to the account API and never to localStorage", async () => {
  axios.put.mockResolvedValue({ data: { cartItems: serverCart } });
  axios.delete.mockResolvedValue({ data: { cartItems: [] } });
  const store = signedInStore();
  await store.dispatch(addItemToCart(P1, 3));
  expect(axios.put).toHaveBeenCalledWith("/api/v1/cart/items", { productId: P1, quantity: 3 });
  expect(store.getState().cart.cartItems).toEqual(serverCart);
  await store.dispatch(removeItemFromCart(P1));
  expect(axios.delete).toHaveBeenCalledWith(`/api/v1/cart/items/${P1}`);
  expect(store.getState().cart.cartItems).toEqual([]);
  expect(localStorage.getItem("cartItems")).toBeNull();
});

test("logout empties the browser cart and address but does not clear the account cart", async () => {
  const store = signedInStore();
  await store.dispatch(syncAccount());
  axios.get.mockResolvedValue({ data: { success: true } });
  await store.dispatch(logout());
  expect(axios.delete).not.toHaveBeenCalledWith("/api/v1/cart");
  expect(store.getState().cart).toEqual({ cartItems: [], shippingInfo: {}, savedShippingInfo: null });
});

test("a guest address stays in localStorage only", async () => {
  const store = makeStore();
  await store.dispatch(saveShippingInfo({ address: "A", city: "B" }));
  expect(axios.put).not.toHaveBeenCalled();
  expect(JSON.parse(localStorage.getItem("shippingInfo"))).toEqual({ address: "A", city: "B" });
});
