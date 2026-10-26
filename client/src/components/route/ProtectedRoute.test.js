import React from "react";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import { MemoryRouter, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

function renderRoute(auth) {
  const store = createStore(() => ({ auth }));
  return render(<Provider store={store}><MemoryRouter initialEntries={["/admin/users"]}>
    <ProtectedRoute exact path="/admin/users" isAdmin component={() => <div>Private users</div>} />
    <Route path="/login"><div>Login screen</div></Route>
    <Route exact path="/"><div>Home screen</div></Route>
  </MemoryRouter></Provider>);
}

test("guest is sent to login", () => {
  renderRoute({ loading: false, isAuthenticated: false });
  expect(screen.queryByText("Private users")).toBeNull();
  expect(screen.getByText("Login screen")).toBeTruthy();
});
test("ordinary user cannot render admin content", () => {
  renderRoute({ loading: false, isAuthenticated: true, user: { role: "user" } });
  expect(screen.queryByText("Private users")).toBeNull();
  expect(screen.getByText("Home screen")).toBeTruthy();
});
test("admin can render admin content", () => {
  renderRoute({ loading: false, isAuthenticated: true, user: { role: "admin" } });
  expect(screen.getByText("Private users")).toBeTruthy();
});
test("private content stays hidden while authentication is loading", () => {
  renderRoute({ loading: true });
  expect(screen.queryByText("Private users")).toBeNull();
  expect(screen.queryByText("Login screen")).toBeNull();
});
