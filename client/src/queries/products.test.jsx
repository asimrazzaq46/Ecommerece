import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import {
  useProducts,
  useProduct,
  useReviewMutation,
  messageFor,
} from "./products";
jest.mock("axios");
let client;
beforeEach(() => {
  client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: 30000 },
      mutations: { retry: false },
    },
  });
});
afterEach(() => client.clear());
const wrapper = ({ children }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);
test("search preserves special characters and filters, and exposes a cancellation signal", async () => {
  axios.get.mockResolvedValue({ data: { products: [] } });
  const { result } = renderHook(
    () =>
      useProducts({
        keyword: "A&B + camera",
        page: 2,
        price: [10, 200],
        category: "Clothes/shoes",
        rating: 3,
      }),
    { wrapper },
  );
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  const [url, options] = axios.get.mock.calls[0],
    params = new URL(url, "http://localhost").searchParams;
  expect(params.get("keyword")).toBe("A&B + camera");
  expect(params.get("catagory")).toBe("Clothes/shoes");
  expect(params.get("price[lte]")).toBe("200");
  expect(params.get("page")).toBe("2");
  expect(params.get("rating[gte]")).toBe("3");
  expect(options.signal).toBeInstanceOf(AbortSignal);
});
test("failed request can be retried and fresh product detail is reused", async () => {
  axios.get
    .mockRejectedValueOnce(new Error("Network Error"))
    .mockResolvedValue({ data: { product: { _id: "one", name: "Camera" } } });
  const first = renderHook(() => useProduct("one"), { wrapper });
  await waitFor(() => expect(first.result.current.isError).toBe(true));
  await act(async () => {
    await first.result.current.refetch();
  });
  await waitFor(() => expect(first.result.current.data?.name).toBe("Camera"));
  renderHook(() => useProduct("one"), { wrapper });
  expect(axios.get).toHaveBeenCalledTimes(2);
});
test("changing filters cancels the old request and cannot show its late response", async () => {
  let resolveOld;
  axios.get
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    )
    .mockResolvedValue({ data: { products: [{ name: "Laptop" }] } });
  const { result, rerender } = renderHook(
    ({ keyword }) => useProducts({ keyword }),
    { initialProps: { keyword: "camera" }, wrapper },
  );
  const oldSignal = axios.get.mock.calls[0][1].signal;
  rerender({ keyword: "laptop" });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(oldSignal.aborted).toBe(true);
  await act(async () => {
    resolveOld({ data: { products: [{ name: "Old camera" }] } });
  });
  expect(result.current.data.products[0].name).toBe("Laptop");
});
test("review success refreshes product caches and failures retain backend messages", async () => {
  client.setQueryData(["products", "detail", "one"], { name: "Camera" });
  client.setQueryData(["products", "admin"], []);
  axios.put
    .mockResolvedValueOnce({ data: { success: true } })
    .mockRejectedValueOnce({
      response: { data: { Message: "Invalid rating" } },
    });
  const { result } = renderHook(() => useReviewMutation("one"), { wrapper });
  await act(async () => {
    await result.current.mutateAsync({ rating: 5, comment: "Useful" });
  });
  expect(axios.put).toHaveBeenCalledWith("/api/v1/review", {
    productId: "one",
    rating: 5,
    comment: "Useful",
  });
  expect(
    client.getQueryState(["products", "detail", "one"]).isInvalidated,
  ).toBe(true);
  expect(client.getQueryState(["products", "admin"]).isInvalidated).toBe(true);
  await act(async () => {
    try {
      await result.current.mutateAsync({ rating: 0 });
    } catch {}
  });
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(messageFor(result.current.error)).toBe("Invalid rating");
});
