import axios from "axios";
import { getProducts, newProduct, newReview } from "./index";
import { ALL_PRODUCT_FAIL, ALL_PRODUCT_SUCCESS, NEW_REVIEW_FAIL } from "../constants/productConstants";

jest.mock("axios");

test("search encodes special characters without changing filter parameters", async () => {
  axios.get.mockResolvedValue({ data: { products: [], filteredProductsCount: 0 } });
  const dispatch = jest.fn();
  await getProducts("A&B + camera", 2, [10, 200], "Clothes/shoes", 3)(dispatch);
  const url = new URL(axios.get.mock.calls[0][0], "http://localhost");
  expect(url.searchParams.get("keyword")).toBe("A&B + camera");
  expect(url.searchParams.get("catagory")).toBe("Clothes/shoes");
  expect(url.searchParams.get("price[lte]")).toBe("200");
  expect(url.searchParams.get("page")).toBe("2");
  expect(dispatch).toHaveBeenLastCalledWith(expect.objectContaining({ type: ALL_PRODUCT_SUCCESS }));
});

test("offline product request reports failure and a subsequent retry succeeds", async () => {
  axios.get.mockRejectedValueOnce(new Error("Network Error")).mockResolvedValueOnce({ data: { products: [] } });
  const dispatch = jest.fn();
  await getProducts()(dispatch);
  expect(dispatch).toHaveBeenLastCalledWith({ type: ALL_PRODUCT_FAIL, payload: "Network Error" });
  await getProducts()(dispatch);
  expect(dispatch).toHaveBeenLastCalledWith(expect.objectContaining({ type: ALL_PRODUCT_SUCCESS }));
});

test("product FormData is sent without a forced JSON content type", async () => {
  axios.post.mockResolvedValue({ data: { success: true } });
  const form = new FormData();
  form.append("name", "Camera");
  await newProduct(form)(jest.fn());
  expect(axios.post).toHaveBeenLastCalledWith("/api/v1/admin/products/new", form, {});
});

test("review errors use the backend Message field", async () => {
  axios.put.mockRejectedValue({ response: { data: { Message: "Invalid rating" } } });
  const dispatch = jest.fn();
  await newReview({})(dispatch);
  expect(dispatch).toHaveBeenLastCalledWith({ type: NEW_REVIEW_FAIL, payload: "Invalid rating" });
});
