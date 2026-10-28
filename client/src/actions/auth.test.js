import axios from "axios";
import { makeStore } from "../store";
import { loadUser } from "./index";
jest.mock("axios");
test("an unauthenticated session check does not display a false login failure", async () => {
  axios.get.mockRejectedValue({
    response: { status: 401, data: { Message: "Login first" } },
  });
  const store = makeStore();
  await store.dispatch(loadUser());
  expect(store.getState().auth).toMatchObject({
    loading: false,
    isAuthenticated: false,
    error: null,
  });
});
test("session network failures remain visible", async () => {
  axios.get.mockRejectedValue(new Error("Network unavailable"));
  const store = makeStore();
  await store.dispatch(loadUser());
  expect(store.getState().auth.error).toBe("Network unavailable");
});

test("successful registration authenticates the main application and logout resets registration", async () => {
  const { register, logout } = require("./index");
  const user = {_id:"buyer",name:"Buyer",role:"user"};
  axios.post.mockResolvedValue({data:{user}});
  const store=makeStore(); await store.dispatch(register(new FormData()));
  expect(store.getState().auth).toMatchObject({isAuthenticated:true,user});
  expect(store.getState().registerUser.isAuthenticated).toBe(true);
  axios.get.mockResolvedValue({data:{success:true}}); await store.dispatch(logout());
  expect(store.getState().auth.isAuthenticated).toBe(false);
  expect(store.getState().registerUser).toEqual({});
});
