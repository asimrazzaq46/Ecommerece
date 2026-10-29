// UPDATED: the dashboard renders the aggregated /admin/stats response (no full order/user downloads)
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import Dashboard, { fillMonths } from "./Dashboard";

jest.mock("axios");
jest.mock("../layouts/MetaDAta", () => () => null);
jest.mock("./AdminLayout", () => ({ children }) => <div>{children}</div>);

const now = new Date();
const stats = {
  revenue: 150, orders: 2, processing: 1, users: 2, newUsers: 1, products: 3, outOfStock: 1, lowStockCount: 1,
  monthly: [{ year: now.getFullYear(), month: now.getMonth() + 1, revenue: 100, orders: 1 }],
  recent: [{ _id: "aaaaaaaaaaaaaaaaaaaa0001", createdAt: now.toISOString(), totalPrice: 100, orderStatus: "Processing", user: { name: "Ann", email: "a@x.co" }, orderItems: [{ product: "p1", image: "/b.png", quantity: 2 }] }],
  lowStock: [{ _id: "p1", name: "Bag", stock: 0, image: "/b.png" }, { _id: "p2", name: "Lamp", stock: 3, image: "/l.png" }],
};

test("months are filled for the last 6 calendar months", () => {
  const months = fillMonths(stats.monthly, now);
  expect(months).toHaveLength(6);
  expect(months[5]).toMatchObject({ revenue: 100, orders: 1 });
  expect(months.slice(0, 5).every((m) => m.orders === 0)).toBe(true);
});

test("KPIs, recent orders and low stock come from one stats request", async () => {
  axios.get.mockResolvedValue({ data: { success: true, stats } });
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter><Dashboard /></MemoryRouter>
    </QueryClientProvider>,
  );
  expect(await screen.findByText("$150.00")).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText("1 processing")).toBeInTheDocument());
  expect(screen.getByText("1 new this month")).toBeInTheDocument();
  expect(screen.getByText("1 out of stock • 1 low stock")).toBeInTheDocument();
  expect(screen.getByText("Ann")).toBeInTheDocument();
  expect(screen.getByText("Out of stock")).toBeInTheDocument();
  expect(screen.getByText("3 left")).toBeInTheDocument();
  expect(axios.get).toHaveBeenCalledTimes(1);
  expect(axios.get.mock.calls[0][0]).toBe("/api/v1/admin/stats");
});
