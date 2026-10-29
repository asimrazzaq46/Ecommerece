import axios from "axios";
axios.defaults.headers.common["X-ShopIT-Request"] = "1";
import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { AlertProvider } from "./components/ui/Alerts";
import { queryClient } from "./queries/products";
import { store } from "./store";
import "./styles/veyra.css";
import "./styles/print.css"; // UPDATED: receipt print layout // UPDATED: Veyra design tokens
import "./i18n"; // UPDATED: initialise EN/IT translations before rendering
import App from "./App";
// UPDATED: React renders the real <title>/description per page; drop the static fallback so only one of each remains
document.head.querySelectorAll("[data-static-seo]").forEach((node) => node.remove());
createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <AlertProvider>
        <App />
      </AlertProvider>
    </QueryClientProvider>
  </Provider>,
);
