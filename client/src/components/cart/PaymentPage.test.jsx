import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import PaymentPage from "./PaymentPage";

jest.mock("axios");
jest.mock("@stripe/stripe-js", () => ({ loadStripe: jest.fn() }));
jest.mock("@stripe/react-stripe-js", () => ({ Elements: ({ children }) => children }));
jest.mock("./Payment", () => () => <div>Payment form ready</div>);

test("payment route loads key on mount after authentication", async () => {
  axios.get.mockResolvedValue({ data: { stripeApiKey: "pk_test_fixture" } });
  loadStripe.mockResolvedValue({});
  render(<PaymentPage />);
  expect(await screen.findByText("Payment form ready")).toBeTruthy();
  expect(axios.get).toHaveBeenCalledWith("/api/v1/stripeapi");
});

test("key loading failure offers a working retry", async () => {
  axios.get.mockRejectedValueOnce(new Error("Network unavailable")).mockResolvedValueOnce({ data: { stripeApiKey: "pk_test_fixture" } });
  loadStripe.mockResolvedValue({});
  render(<PaymentPage />);
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Network unavailable"));
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(await screen.findByText("Payment form ready")).toBeTruthy();
});
