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
