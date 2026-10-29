// UPDATED: client-side validation and token-error handling for the recovery pages.
import { fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import { makeStore } from "../../store";
import ForgotPassword from "./ForgotPassword";
import NewPassword from "./NewPassword";

jest.mock("axios");
jest.mock("../layouts/MetaDAta", () => () => null);

const open = (path, element, route = path) =>
  render(
    <Provider store={makeStore()}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={route} element={element} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

test("forgot password rejects an invalid email and shows the sent banner on success", async () => {
  axios.post.mockResolvedValue({ data: { success: true, message: "email sent to a@b.co" } });
  open("/password/forgot", <ForgotPassword />);
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "nope" } });
  fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
  expect(screen.getByText("Please enter a valid email address.")).toBeInTheDocument();
  expect(axios.post).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "a@b.co" } });
  fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
  expect(await screen.findByText(/sent a password reset link to a@b.co/)).toBeInTheDocument();
});

test("reset password blocks mismatches and explains an expired link", async () => {
  axios.put.mockRejectedValue({ response: { data: { Message: "The Password token is invalid or has been expired." } } });
  open("/password/reset/tok", <NewPassword />, "/password/reset/:token");
  fireEvent.change(screen.getByLabelText("New password"), { target: { value: "secret1" } });
  fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "secret2" } });
  fireEvent.click(screen.getByRole("button", { name: "Update password" }));
  expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
  expect(axios.put).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "secret1" } });
  fireEvent.click(screen.getByRole("button", { name: "Update password" }));
  expect(await screen.findByRole("link", { name: "Request a new link" })).toHaveAttribute("href", "/password/forgot");
  expect(axios.put.mock.calls[0][0]).toContain("/password/reset/tok");
});

// UPDATED: the server signs the user in after a reset, so the app must load that session
test("a successful reset loads the signed-in user", async () => {
  axios.put.mockResolvedValue({ data: { success: true } });
  axios.get.mockResolvedValue({ data: { user: { _id: "u1", name: "A" } } });
  open("/password/reset/tok", <NewPassword />, "/password/reset/:token");
  fireEvent.change(screen.getByLabelText("New password"), { target: { value: "secret12" } });
  fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "secret12" } });
  fireEvent.click(screen.getByRole("button", { name: "Update password" }));
  await screen.findByRole("button", { name: "Update password" });
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(axios.get).toHaveBeenCalledWith("/api/v1/me");
});
