import { fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { useNavigate, MemoryRouter } from "react-router-dom";
import { makeStore } from "../../store";
import Shipping from "./Shipping";
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));
afterEach(() => localStorage.clear());
test("shipping requires an explicit country and preserves international postal codes", () => {
  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);
  const store = makeStore();
  render(
    <Provider store={store}>
      <MemoryRouter>
        <Shipping />
      </MemoryRouter>
    </Provider>,
  );
  expect(screen.getByLabelText("Country")).toHaveValue("");
  expect(screen.getByLabelText("Country")).toBeInvalid();
  for (const [label, value] of [
    ["Address", "1 Test Street"],
    ["City", "London"],
    ["Phone number", "123456789"],
    ["Postal code", "SW1A 1AA"],
    ["Country", "United Kingdom"],
  ])
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "Continue to review" }));
  expect(navigate).toHaveBeenCalledWith("/confirm");
  expect(store.getState().cart.shippingInfo).toMatchObject({
    postalCode: "SW1A 1AA",
    country: "United Kingdom",
  });
  expect(JSON.parse(localStorage.getItem("shippingInfo")).postalCode).toBe(
    "SW1A 1AA",
  );
});

test("shipping shows translated field errors instead of navigating", () => {
  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);
  render(
    <Provider store={makeStore()}>
      <MemoryRouter>
        <Shipping />
      </MemoryRouter>
    </Provider>,
  );
  fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "abc" } });
  fireEvent.click(screen.getByRole("button", { name: "Continue to review" }));
  expect(screen.getByText("Please select a country.")).toBeInTheDocument();
  expect(screen.getByText("Please enter a valid phone number.")).toBeInTheDocument();
  expect(navigate).not.toHaveBeenCalled();
});
