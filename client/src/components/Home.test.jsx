import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { useProducts } from "../queries/products";
import Home from "./Home";
jest.mock("../queries/products", () => ({ useProducts: jest.fn(), messageFor: e => e.message }));
jest.mock("./layouts/MetaDAta", () => () => null);
jest.mock("./products/products", () => () => <div>Product</div>);
// UPDATED: real router, because page/filters now live in the URL
const at = (path) => <MemoryRouter initialEntries={[path]}><Routes><Route path="/search/:keyword" element={<Home />} /></Routes></MemoryRouter>;
beforeEach(() => {
  useProducts.mockReturnValue({ data: { products: [{ _id: "one" }], productCount: 100, filteredProductsCount: 6, resultPerPage: 3 }, isPending: false });
});
test("pagination uses filtered count and resets when search changes", () => {
  const { unmount } = render(at("/search/camera"));
  expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(useProducts).toHaveBeenLastCalledWith(expect.objectContaining({ keyword: "camera", page: 2 }));
  unmount(); render(at("/search/laptop"));
  expect(useProducts).toHaveBeenLastCalledWith(expect.objectContaining({ keyword: "laptop", page: 1 }));
});
test("catalog failure leaves a retry action available", () => {
  const refetch = jest.fn(); useProducts.mockReturnValue({ error: new Error("Network Error"), isPending: false, refetch });
  render(at("/search/camera")); fireEvent.click(screen.getByRole("button", { name: "Retry" })); expect(refetch).toHaveBeenCalled();
});
