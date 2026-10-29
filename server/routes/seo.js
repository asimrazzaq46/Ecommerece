// UPDATED: /robots.txt and /sitemap.xml for the public storefront. Both are built from FRONTEND_URL (the public
// site origin) and the real product records, so new/deleted products show up without editing a file.
// The host must route these two paths to this server (or copy the output into the static site).
const express = require("express");
const Product = require("../models/product");

const router = express.Router();
const PRIVATE = ["/api/", "/admin/", "/dashboard", "/login", "/register", "/password/", "/cart", "/shipping", "/confirm", "/payment", "/success", "/orders/", "/order/", "/me"];
const escapeXml = (value) => String(value).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);
const origin = () => (process.env.FRONTEND_URL || "").replace(/\/+$/, "");

router.get("/robots.txt", (req, res) => {
  const lines = ["User-agent: *", ...PRIVATE.map((p) => `Disallow: ${p}`), "Allow: /", ""];
  // shortcut: no Sitemap line when FRONTEND_URL is unset (local dev); it is required in production.
  if (origin()) lines.push(`Sitemap: ${origin()}/sitemap.xml`, "");
  res.type("text/plain").set("Cache-Control", "public, max-age=3600").send(lines.join("\n"));
});

router.get("/sitemap.xml", async (req, res, next) => {
  try {
    const base = origin();
    if (!base) return res.status(404).type("text/plain").send("FRONTEND_URL is not configured");
    // shortcut: one sitemap file holds up to 50,000 URLs; split into a sitemap index beyond that.
    const [products, categories] = await Promise.all([
      Product.find().select("_id updatedAt createdAt").sort({ createdAt: -1 }).limit(49000).lean(),
      Product.distinct("catagory"),
    ]);
    const url = (loc, lastmod) => `<url><loc>${escapeXml(base + loc)}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ""}</url>`;
    const body = [
      url("/"),
      ...categories.filter(Boolean).sort().map((c) => url(`/?category=${encodeURIComponent(c)}`)),
      ...products.map((p) => url(`/product/${p._id}`, p.updatedAt || p.createdAt)),
    ].join("");
    res.type("application/xml").set("Cache-Control", "public, max-age=3600")
      .send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`);
  } catch (error) { next(error); }
});

module.exports = router;
