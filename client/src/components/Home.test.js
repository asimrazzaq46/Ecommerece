import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useDispatch, useSelector } from "react-redux";
import { getProducts } from "../actions";
import Home from "./Home";

jest.mock("react-redux", () => ({ useDispatch: jest.fn(), useSelector: jest.fn() }));
jest.mock("../actions", () => ({ getProducts: jest.fn(() => ({ type: "FETCH" })) }));
jest.mock("react-alert", () => ({ useAlert: () => ({ error: jest.fn() }) }));
jest.mock("./layouts/MetaDAta", () => () => null);
jest.mock("./products/products", () => () => <div>Product</div>);
jest.mock("react-js-pagination", () => props => <button onClick={() => props.onChange(2)}>Page 2 of {props.totalItemsCount}</button>);

beforeEach(() => {
  useDispatch.mockReturnValue(jest.fn());
  useSelector.mockImplementation(select => select({ products: { products: [{ _id: "one" }], productCount: 100, filteredProductsCount: 6, resultPerPage: 3, loading: false } }));
});

test("pagination uses filtered count and resets when search changes", () => {
  const { rerender } = render(<Home match={{ params: { keyword: "camera" } }} />);
  fireEvent.click(screen.getByRole("button", { name: "Page 2 of 6" }));
  expect(getProducts).toHaveBeenLastCalledWith("camera", 2, [1, 3000], "", 0);
  rerender(<Home match={{ params: { keyword: "laptop" } }} />);
  expect(getProducts).toHaveBeenLastCalledWith("laptop", 1, [1, 3000], "", 0);
});

test("catalog failure leaves a retry action available", () => {
  useSelector.mockImplementation(select => select({ products: { products: [], error: "Network Error", loading: false } }));
  render(<Home match={{ params: {} }} />);
  const calls = getProducts.mock.calls.length;
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(getProducts.mock.calls.length).toBe(calls + 1);
});
