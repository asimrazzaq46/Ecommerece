import React from "react";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { createStore } from "@reduxjs/toolkit";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

function renderRoute(auth) {
  const store = createStore(() => ({ auth }));
  return render(<Provider store={store}><MemoryRouter initialEntries={["/admin/users"]}>
    <Routes><Route path="/admin/users" element={<ProtectedRoute isAdmin><div>Private users</div></ProtectedRoute>} />
    <Route path="/login" element={<div>Login screen</div>} />
    <Route path="/" element={<div>Home screen</div>} /></Routes>
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
