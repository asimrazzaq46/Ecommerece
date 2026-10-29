// UPDATED: orders, process order, users and reviews admin pages
import { fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import OrdersList from "./OrdersList";
import ProcessOrder from "./ProcessOrder";
import UsersList from "./UsersList";
import ProductReviews from "./ProductReviews";

jest.mock("../layouts/MetaDAta", () => () => null);
jest.mock("./AdminLayout", () => ({ children }) => <div>{children}</div>);
const mockDispatched = [];
jest.mock("../../actions", () => {
  const act = (type) => (...args) => { mockDispatched.push([type, ...args]); return { type: "noop" }; };
  return {
    allOrders: act("allOrders"), allUsers: act("allUsers"), deleteOrder: act("deleteOrder"), deleteUser: act("deleteUser"),
    updateOrder: act("updateOrder"), getOrderDetails: act("getOrderDetails"), getProductReviews: act("getProductReviews"),
    deleteReview: act("deleteReview"), clearError: () => ({ type: "noop" }),
  };
});
jest.mock("../../queries/products", () => ({
  messageFor: (e) => e.message,
  useAdminProducts: () => ({ isPending: false, data: [{ _id: "pppppppppppppppppppp0001", name: "Camera", NumOfReviews: 1, images: [{ url: "/c.png" }] }] }),
}));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
beforeEach(() => { mockDispatched.length = 0; });

const order = (id, status, paid = true) => ({
  _id: id, createdAt: "2026-02-01T10:00:00Z", totalPrice: 50, itemsPrice: 45, taxPrice: 5, shippingPrice: 0, orderStatus: status,
  paymentInfo: { status: paid ? "succeeded" : "failed", id: "pi_abc" }, user: { _id: "u1", name: "Ann", email: "ann@x.co" },
  orderItems: [{ product: "p1", name: "Camera", image: "/c.png", price: 45, quantity: 1 }], shippingInfo: { address: "Via 1", city: "Roma", postalCode: "1", country: "Italy", phoneNo: "1" },
});
const wrap = (state, ui, path = "/", route = "*") =>
  render(<Provider store={configureStore({ reducer: () => state })}><MemoryRouter initialEntries={[path]}><Routes><Route path={route} element={ui} /></Routes></MemoryRouter></Provider>);

test("order deletion needs confirmation", () => {
  wrap({ allOrders: { orders: [order("aaaaaaaaaaaaaaaaaaaa0001", "Processing")], totalAmount: 50 }, order: {} }, <OrdersList />);
  fireEvent.click(screen.getByRole("button", { name: /Delete order/ }));
  fireEvent.click(screen.getByRole("button", { name: "Keep order" }));
  expect(mockDispatched.some(([type]) => type === "deleteOrder")).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: /Delete order/ }));
  fireEvent.click(screen.getByRole("button", { name: "Delete order" }));
  expect(mockDispatched).toContainEqual(["deleteOrder", "aaaaaaaaaaaaaaaaaaaa0001"]);
});

test("process order only offers forward status changes and locks unpaid or delivered orders", () => {
  const id = "aaaaaaaaaaaaaaaaaaaa0002";
  const { unmount } = wrap({ orderDetails: { order: order(id, "Shipped") }, order: {} }, <ProcessOrder />, "/admin/order/" + id, "/admin/order/:id");
  expect(screen.queryByRole("option", { name: "Processing" })).not.toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Delivered" })).toBeInTheDocument();
  unmount();
  wrap({ orderDetails: { order: order(id, "Processing", false) }, order: {} }, <ProcessOrder />, "/admin/order/" + id, "/admin/order/:id");
  expect(screen.getByLabelText("Status")).toBeDisabled();
});

test("users: you and other admins cannot be deleted, customers can after confirming", () => {
  const users = [
    { _id: "u-me", name: "Me", email: "me@x.co", role: "admin", createdAt: "2026-01-01" },
    { _id: "u-adm", name: "Other Admin", email: "adm@x.co", role: "admin", createdAt: "2026-01-02" },
    { _id: "u-cus", name: "Customer", email: "c@x.co", role: "user", createdAt: "2026-01-03" },
  ];
  wrap({ allUsers: { users }, allOrders: { orders: [] }, user: {}, auth: { user: { _id: "u-me" } } }, <UsersList />);
  expect(screen.getByRole("button", { name: "Delete Me" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Delete Other Admin" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Delete Customer" }));
  fireEvent.click(screen.getByRole("button", { name: "Delete user" }));
  expect(mockDispatched).toContainEqual(["deleteUser", "u-cus"]);
});

test("reviews: choose a product, see reviews, delete after confirmation", () => {
  const reviews = [{ _id: "r1", name: "Bob", rating: 4, comment: "Nice" }];
  wrap({ productReviews: { reviews }, deleteReview: {} }, <ProductReviews />);
  fireEvent.click(screen.getByRole("button", { name: /Camera/ }));
  expect(mockDispatched).toContainEqual(["getProductReviews", "pppppppppppppppppppp0001"]);
  expect(screen.getByText("Nice")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Delete review by Bob" }));
  fireEvent.click(screen.getByRole("button", { name: "Delete review" }));
  expect(mockDispatched).toContainEqual(["deleteReview", "r1", "pppppppppppppppppppp0001"]);
});
