import axios from "axios";
import {
  QueryClient,
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1, refetchOnWindowFocus: false },
  },
});
export const messageFor = (error) =>
  error?.response?.data?.Message || error?.message || "Request failed";
export const productOptions = (id) => ({
  queryKey: ["products", "detail", id],
  queryFn: async ({ signal }) =>
    (await axios.get(`/api/v1/product/${id}`, { signal })).data.product,
  enabled: Boolean(id),
});
export const useProduct = (id) => useQuery(productOptions(id));
export function useProducts({
  keyword = "",
  page = 1,
  price = [1, 3000],
  category = "",
  rating = 0,
}) {
  return useQuery({
    queryKey: ["products", "list", { keyword, page, price, category, rating }],
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        keyword,
        page,
        "price[gte]": price[0],
        "price[lte]": price[1],
        "rating[gte]": rating,
      });
      if (category) params.set("catagory", category);
      return (await axios.get(`/api/v1/products?${params}`, { signal })).data;
    },
  });
}
export const useAdminProducts = () =>
  useQuery({
    queryKey: ["products", "admin"],
    queryFn: async ({ signal }) =>
      (await axios.get("/api/v1/admin/products", { signal })).data.products,
  });
export function useReviewMutation(id) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (review) =>
      (await axios.put("/api/v1/review", { ...review, productId: id })).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["products"] }),
  });
}
