import { render, screen, fireEvent, within } from "@testing-library/react";
import DataTable from "./DataTable";
test("admin table sorts numeric prices, searches and paginates without losing row actions", () => {
  const action = jest.fn();
  const rows = Array.from({ length: 12 }, (_, i) => ({
    id: String(i),
    name: "Product " + i,
    price: "$" + (i + 1),
    actions: <button onClick={() => action(i)}>Edit {i}</button>,
  }));
  render(
    <DataTable
      data={{
        columns: [
          { field: "name", label: "Name", sort: "asc" },
          { field: "price", label: "Price", sort: "asc" },
          { field: "actions", label: "Actions" },
        ],
        rows,
      }}
    />,
  );
  expect(screen.queryByText("Product 11")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByText("Product 11")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Search"), {
    target: { value: "Product 11" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Edit 11" }));
  expect(action).toHaveBeenCalledWith(11);
  fireEvent.change(screen.getByLabelText("Search"), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "Price" }));
  fireEvent.click(screen.getByRole("button", { name: "Price" }));
  expect(
    within(screen.getAllByRole("row")[1]).getByText("$12"),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Search"), {
    target: { value: "missing" },
  });
  expect(screen.getByText("No records found.")).toBeInTheDocument();
});

test("order statuses remain searchable and sortable when rendered with colored markup", () => {
  render(
    <DataTable
      data={{
        columns: [{ field: "status", label: "Status", sort: "asc" }],
        rows: [
          { id: "one", status: <p style={{ color: "green" }}>Delivered</p> },
          { id: "two", status: <p>Processing</p> },
        ],
      }}
    />,
  );
  fireEvent.change(screen.getByLabelText("Search"), {
    target: { value: "delivered" },
  });
  expect(screen.getByText("Delivered")).toBeInTheDocument();
  expect(screen.queryByText("Processing")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Search"), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "Status" }));
  expect(
    within(screen.getAllByRole("row")[1]).getByText("Delivered"),
  ).toBeInTheDocument();
});
