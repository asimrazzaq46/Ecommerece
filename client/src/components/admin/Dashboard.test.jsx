// UPDATED: dashboard figures come only from the loaded orders/users/products
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";
import Dashboard, { monthlyTotals } from "./Dashboard";

jest.mock("../layouts/MetaDAta", () => () => null);
jest.mock("../../actions", () => ({ allOrders: () => ({ type: "noop" }), allUsers: () => ({ type: "noop" }) }));
jest.mock("../../queries/products", () => ({
  messageFor: (e) => e.message,
  useAdminProducts: () => ({
    isPending: false,
    data: [
      { _id: "p1", name: "Bag", stock: 0, images: [{ url: "/b.png" }] },
      { _id: "p2", name: "Lamp", stock: 3, images: [{ url: "/l.png" }] },
      { _id: "p3", name: "Chair", stock: 40, images: [{ url: "/c.png" }] },
    ],
  }),
}));

const now = new Date();
const orders = [
  { _id: "aaaaaaaaaaaaaaaaaaaa0001", createdAt: now.toISOString(), totalPrice: 100, orderStatus: "Processing", user: { name: "Ann", email: "a@x.co" }, orderItems: [{ product: "p1", image: "/b.png", quantity: 2 }] },
  { _id: "aaaaaaaaaaaaaaaaaaaa0002", createdAt: new Date(now.getFullYear() - 2, 0, 1).toISOString(), totalPrice: 50, orderStatus: "Delivered", user: { name: "Bo", email: "b@x.co" }, orderItems: [] },
];

test("monthly totals cover the last 6 months only", () => {
  const months = monthlyTotals(orders, now);
  expect(months).toHaveLength(6);
  expect(months[5]).toMatchObject({ revenue: 100, orders: 1 });
  expect(months.reduce((s, m) => s + m.orders, 0)).toBe(1);
});

test("KPIs, recent orders and low stock reflect real data", () => {
  const store = configureStore({
    reducer: () => ({
      auth: { user: { name: "Admin", role: "admin" } },
      allOrders: { orders, totalAmount: 150, loading: false },
      allUsers: { users: [{ createdAt: now.toISOString() }, { createdAt: "2020-01-01" }] },
    }),
  });
  render(
    <Provider store={store}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </Provider>,
  );
  expect(screen.getByText("$150.00")).toBeInTheDocument();
  expect(screen.getByText("1 processing")).toBeInTheDocument();
  expect(screen.getByText("1 new this month")).toBeInTheDocument();
  expect(screen.getByText("1 out of stock • 1 low stock")).toBeInTheDocument();
  expect(screen.getByText("Ann")).toBeInTheDocument();
  expect(screen.getByText("Out of stock")).toBeInTheDocument();
  expect(screen.getByText("3 left")).toBeInTheDocument();
  expect(screen.queryByText("Chair")).not.toBeInTheDocument();
});
