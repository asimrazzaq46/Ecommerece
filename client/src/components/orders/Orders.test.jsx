// UPDATED: order history filters and order details timeline
import { fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ListOrders from "./ListOrders";
import OrderDetails from "./OrderDetails";

jest.mock("../layouts/MetaDAta", () => () => null);
jest.mock("../user/AccountNav", () => () => null);
jest.mock("../../actions", () => ({ myAllOrders: () => ({ type: "noop" }), getOrderDetails: () => ({ type: "noop" }), clearError: () => ({ type: "noop" }) }));

const item = (name) => ({ product: "p" + name, name, image: "/x.png", price: 10, quantity: 2 });
const orders = [
  { _id: "aaaaaaaaaaaaaaaaaaaa0001", createdAt: "2026-02-01T10:00:00Z", totalPrice: 25, orderStatus: "Processing", paymentInfo: { status: "succeeded", id: "pi_123456789012" }, orderItems: [item("Camera")] },
  { _id: "aaaaaaaaaaaaaaaaaaaa0002", createdAt: "2026-01-01T10:00:00Z", totalPrice: 90, orderStatus: "Delivered", deliveredAt: "2026-01-05T10:00:00Z", paidAt: "2026-01-01T10:00:00Z", paymentInfo: { status: "succeeded" }, orderItems: [item("Lamp")], itemsPrice: 80, shippingPrice: 0, taxPrice: 4, shippingInfo: { address: "Via 1", city: "Roma", postalCode: "00100", country: "Italy", phoneNo: "1" }, user: { name: "Ann" } },
];
const store = (state) => configureStore({ reducer: () => state });

test("order history filters by status and search", () => {
  render(<Provider store={store({ myOrder: { orders } })}><MemoryRouter><ListOrders /></MemoryRouter></Provider>);
  expect(screen.getByText("Camera")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Delivered/ }));
  expect(screen.queryByText("Camera")).not.toBeInTheDocument();
  expect(screen.getByText("Lamp")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Search by order number or product"), { target: { value: "zzz" } });
  expect(screen.getByText("No orders match your search.")).toBeInTheDocument();
});

test("empty history shows a call to action", () => {
  render(<Provider store={store({ myOrder: { orders: [] } })}><MemoryRouter><ListOrders /></MemoryRouter></Provider>);
  expect(screen.getByRole("link", { name: "Start shopping" })).toHaveAttribute("href", "/");
});

test("order details shows the saved address and a delivered timeline with no invented tracking", () => {
  render(
    <Provider store={store({ orderDetails: { order: orders[1] } })}>
      <MemoryRouter initialEntries={["/order/" + orders[1]._id]}><Routes><Route path="/order/:id" element={<OrderDetails />} /></Routes></MemoryRouter>
    </Provider>,
  );
  expect(screen.getByText("Via 1", { exact: false })).toBeInTheDocument();
  expect(document.querySelectorAll(".vx-timeline .is-done")).toHaveLength(4);
  expect(screen.queryByText(/tracking|waybill/i)).not.toBeInTheDocument();
});
