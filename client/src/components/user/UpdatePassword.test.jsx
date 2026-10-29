// UPDATED: change password validation and show/hide
import { fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";
import UpdatePassword from "./UpdatePassword";

jest.mock("../layouts/MetaDAta", () => () => null);
jest.mock("./AccountNav", () => () => null);
const mockUpdatePassword = jest.fn(() => ({ type: "noop" }));
jest.mock("../../actions", () => ({ updatePassword: (d) => mockUpdatePassword(d), clearError: () => ({ type: "noop" }) }));

const open = () => render(<Provider store={configureStore({ reducer: () => ({ userPasswords: {} }) })}><MemoryRouter><UpdatePassword /></MemoryRouter></Provider>);
const fill = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

test("blocks empty, unchanged and mismatched passwords", () => {
  open();
  fireEvent.click(screen.getByRole("button", { name: "Update password" }));
  expect(screen.getByText("Please enter your current password.")).toBeInTheDocument();
  fill("Current password", "oldpass1"); fill("New password", "oldpass1"); fill("Confirm new password", "oldpass1");
  fireEvent.click(screen.getByRole("button", { name: "Update password" }));
  expect(screen.getByText("Your new password must be different from the current one.")).toBeInTheDocument();
  fill("New password", "newpass12"); fill("Confirm new password", "other");
  fireEvent.click(screen.getByRole("button", { name: "Update password" }));
  expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
  expect(mockUpdatePassword).not.toHaveBeenCalled();
});

test("submits the old and new password and can reveal a field", () => {
  open();
  fill("Current password", "oldpass1"); fill("New password", "newpass12"); fill("Confirm new password", "newpass12");
  fireEvent.click(screen.getAllByRole("button", { name: "Show password" })[0]);
  expect(screen.getByLabelText("Current password")).toHaveAttribute("type", "text");
  fireEvent.click(screen.getByRole("button", { name: "Update password" }));
  const data = mockUpdatePassword.mock.calls[0][0];
  expect([data.get("oldPassword"), data.get("password")]).toEqual(["oldpass1", "newpass12"]);
});
