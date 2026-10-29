import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import ProductDetails from "./productDetails";
jest.mock("axios");
let client;
beforeEach(() => {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  axios.get.mockResolvedValue({
    data: {
      product: {
        _id: "one",
        name: "Camera",
        stock: 2,
        price: 50,
        rating: 0,
        NumOfReviews: 0,
        images: [{ url: "/one.jpg" }, { url: "/two.jpg" }],
      },
    },
  });
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
afterEach(() => client.clear());
function open(user) {
  const store = configureStore({ reducer: () => ({ auth: { user } }) });
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/product/one"]}>
          <Routes>
            <Route path="/product/:id" element={<ProductDetails />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}
test("guest sees bounded quantities, image navigation and no review submission button", async () => {
  open(null);
  await screen.findByRole("heading", { name: "Camera" });
  expect(
    screen.getByRole("button", { name: "Decrease quantity" }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }));
  expect(screen.getByRole("spinbutton", { name: "Quantity" })).toHaveValue(2);
  expect(
    screen.getByRole("button", { name: "Increase quantity" }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Next image" }));
  expect(screen.getByAltText("Camera")).toHaveAttribute("src", "/two.jpg");
  expect(
    screen.queryByRole("button", { name: "Write a review" }),
  ).not.toBeInTheDocument();
});
test("signed-in review submission keeps server errors visible and retries successfully", async () => {
  axios.put
    .mockRejectedValueOnce({
      response: { data: { Message: "Please try again" } },
    })
    .mockResolvedValueOnce({ data: { success: true } });
  open({ _id: "buyer" });
  fireEvent.click(
    await screen.findByRole("button", { name: "Write a review" }),
  );
  fireEvent.change(screen.getByLabelText("Comment"), {
    target: { value: "Useful camera" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Submit", exact: true }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Please try again",
  );
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Submit", exact: true }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(axios.put).toHaveBeenLastCalledWith("/api/v1/review", {
    rating: 5,
    comment: "Useful camera",
    productId: "one",
  });
});
