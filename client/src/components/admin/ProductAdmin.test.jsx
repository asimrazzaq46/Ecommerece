// UPDATED: delete confirmation and product form validation
import { fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";
import ProductList from "./ProductList";
import ProductForm from "./ProductForm";

jest.mock("../layouts/MetaDAta", () => () => null);
jest.mock("./AdminLayout", () => ({ children }) => <div>{children}</div>);
const mockDeleteProduct = jest.fn((id) => ({ type: "DELETE_CALLED", id }));
jest.mock("../../actions", () => ({ deleteProduct: (id) => mockDeleteProduct(id), clearError: () => ({ type: "noop" }) }));
jest.mock("../../queries/products", () => ({
  messageFor: (e) => e.message,
  useAdminProducts: () => ({
    isPending: false,
    data: [
      { _id: "aaaaaaaaaaaaaaaaaaaa0001", name: "Camera", price: 50, stock: 0, catagory: "Cameras", images: [{ url: "/c.png" }], createdAt: "2026-01-02" },
      { _id: "aaaaaaaaaaaaaaaaaaaa0002", name: "Lamp", price: 20, stock: 3, catagory: "Home", images: [{ url: "/l.png" }], createdAt: "2026-01-01" },
    ],
  }),
}));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
const wrap = (ui) => render(
  <Provider store={configureStore({ reducer: () => ({ product: {} }) })}>
    <MemoryRouter>{ui}</MemoryRouter>
  </Provider>,
);

test("delete needs an explicit confirmation and can be cancelled", () => {
  wrap(<ProductList />);
  fireEvent.click(screen.getByRole("button", { name: "Delete Camera" }));
  expect(screen.getByRole("dialog")).toHaveTextContent("will be permanently deleted");
  fireEvent.click(screen.getByRole("button", { name: "Keep product" }));
  expect(mockDeleteProduct).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Delete Camera" }));
  fireEvent.click(screen.getByRole("button", { name: "Delete product" }));
  expect(mockDeleteProduct).toHaveBeenCalledWith("aaaaaaaaaaaaaaaaaaaa0001");
});

test("stock tabs filter the list", () => {
  wrap(<ProductList />);
  fireEvent.click(screen.getByRole("button", { name: /Out of stock/ }));
  expect(screen.getByText("Camera")).toBeInTheDocument();
  expect(screen.queryByText("Lamp")).not.toBeInTheDocument();
});

test("create form requires images and valid numbers before submitting", () => {
  const onSubmit = jest.fn();
  wrap(<ProductForm mode="create" onSubmit={onSubmit} />);
  fireEvent.change(screen.getByLabelText("Product name"), { target: { value: "Chair" } });
  fireEvent.change(screen.getByLabelText("Price (USD)"), { target: { value: "-1" } });
  fireEvent.click(screen.getByRole("button", { name: /Create product/ }));
  expect(screen.getByText("Enter a price of 0 or more.")).toBeInTheDocument();
  expect(screen.getByText("Please add at least one image.")).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});

test("edit form is prefilled and can be saved without new images", () => {
  const onSubmit = jest.fn();
  wrap(<ProductForm mode="edit" initial={{ name: "Lamp", seller: "Veyra", description: "Nice", catagory: "Home", price: 20, stock: 3 }} existingImages={[{ url: "/l.png", public_id: "p" }]} onSubmit={onSubmit} />);
  expect(screen.getByLabelText("Product name")).toHaveValue("Lamp");
  fireEvent.click(screen.getByRole("button", { name: /Save changes/ }));
  const data = onSubmit.mock.calls[0][0];
  expect(data.get("catagory")).toBe("Home");
  expect(data.getAll("images")).toEqual([]);
});

// UPDATED: image management in the edit form
test("edit form: set another image as main, remove one, and send the ordered selection", () => {
  const onSubmit = jest.fn();
  const images = [{ url: "/a.png", public_id: "P/a" }, { url: "/b.png", public_id: "P/b" }, { url: "/c.png", public_id: "P/c" }];
  wrap(<ProductForm mode="edit" initial={{ name: "Lamp", seller: "V", description: "d", catagory: "Home", price: 1, stock: 1 }} existingImages={images} onSubmit={onSubmit} />);
  fireEvent.click(screen.getByRole("button", { name: "Set image 3 as main image" }));
  fireEvent.click(screen.getByRole("button", { name: "Remove image 2" }));
  fireEvent.click(screen.getByRole("button", { name: /Save changes/ }));
  const data = onSubmit.mock.calls[0][0];
  expect(JSON.parse(data.get("order"))).toEqual(["e:P/c", "e:P/b"]);
});

test("edit form refuses to save with no images left", () => {
  const onSubmit = jest.fn();
  wrap(<ProductForm mode="edit" initial={{ name: "Lamp", seller: "V", description: "d", catagory: "Home", price: 1, stock: 1 }} existingImages={[{ url: "/a.png", public_id: "P/a" }]} onSubmit={onSubmit} />);
  fireEvent.click(screen.getByRole("button", { name: "Remove image 1" }));
  fireEvent.click(screen.getByRole("button", { name: /Save changes/ }));
  expect(screen.getByText("Please add at least one image.")).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});
