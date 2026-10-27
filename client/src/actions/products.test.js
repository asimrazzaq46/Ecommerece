import axios from "axios";
import { newProduct } from "./index";
import { queryClient } from "../queries/products";
jest.mock("axios");
test("product FormData preserves upload headers and invalidates the product cache", async () => {
  axios.post.mockResolvedValue({ data: { success: true } });
  const invalidate = jest.spyOn(queryClient, "invalidateQueries");
  const form = new FormData(); form.append("name", "Camera");
  await newProduct(form)(jest.fn());
  expect(axios.post).toHaveBeenLastCalledWith("/api/v1/admin/products/new", form, {});
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["products"] });
  invalidate.mockRestore(); queryClient.clear();
});
