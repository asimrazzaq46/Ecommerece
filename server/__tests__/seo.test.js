// UPDATED: robots.txt hides private routes; sitemap lists only real public URLs from the database
const Product = require("../models/product");
const router = require("../routes/seo");

const handler = (path) => router.stack.find((layer) => layer.route?.path === path).route.stack[0].handle;
const reply = () => { const res = { body: "" }; res.type = jest.fn(() => res); res.set = jest.fn(() => res); res.status = jest.fn(() => res); res.send = jest.fn((b) => { res.body = b; return res; }); return res; };

afterEach(() => { delete process.env.FRONTEND_URL; });

test("robots.txt blocks private areas and points to the sitemap", () => {
  process.env.FRONTEND_URL = "https://shop.example/";
  const res = reply();
  handler("/robots.txt")({}, res);
  expect(res.body).toContain("Disallow: /admin/");
  expect(res.body).toContain("Disallow: /cart");
  expect(res.body).not.toMatch(/Disallow: \/product/);
  expect(res.body).toContain("Sitemap: https://shop.example/sitemap.xml");
});

test("sitemap uses real products and categories, no private routes", async () => {
  process.env.FRONTEND_URL = "https://shop.example";
  jest.spyOn(Product, "find").mockReturnValue({ select: () => ({ sort: () => ({ limit: () => ({ lean: async () => [{ _id: "p1", updatedAt: new Date("2026-01-02") }] }) }) }) });
  jest.spyOn(Product, "distinct").mockResolvedValue(["Clothes/shoes", "Home"]);
  const res = reply();
  await handler("/sitemap.xml")({}, res, jest.fn());
  expect(res.body).toContain("<loc>https://shop.example/product/p1</loc>");
  expect(res.body).toContain("<loc>https://shop.example/?category=Clothes%2Fshoes</loc>");
  expect(res.body).not.toMatch(/admin|cart|login|localhost/);
});

test("sitemap is unavailable without a configured public origin", async () => {
  const res = reply();
  await handler("/sitemap.xml")({}, res, jest.fn());
  expect(res.status).toHaveBeenCalledWith(404);
});
