// UPDATED: keyboard + a11y behaviour of the shared Select
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Select from "./Select";

const options = [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }, { value: "c", label: "Gamma" }];

test("opens with the keyboard, moves, selects and closes on Escape", () => {
  const onChange = jest.fn();
  render(<Select value="a" onChange={onChange} options={options} label="Sort" />);
  const box = screen.getByRole("combobox", { name: "Sort" });
  expect(box).toHaveAttribute("aria-expanded", "false");
  fireEvent.keyDown(box, { key: "ArrowDown" });
  expect(box).toHaveAttribute("aria-expanded", "true");
  fireEvent.keyDown(box, { key: "ArrowDown" });
  fireEvent.keyDown(box, { key: "Enter" });
  expect(onChange).toHaveBeenCalledWith("b");
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  fireEvent.keyDown(box, { key: "Enter" });
  fireEvent.keyDown(box, { key: "Escape" });
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  expect(onChange).toHaveBeenCalledTimes(1);
});

test("disabled select cannot be opened", () => {
  render(<Select value="a" onChange={() => {}} options={options} label="Sort" disabled />);
  fireEvent.click(screen.getByRole("combobox"));
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
});
