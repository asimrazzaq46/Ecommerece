// UPDATED: metadata policy: public pages are canonical + indexable, private ones are noindex; JSON-LD cannot close its <script>
import React from "react";
import { render } from "@testing-library/react";
import Seo, { jsonLdText } from "./Seo";
import MetaDAta from "./MetaDAta";

test("JSON-LD escapes < so product text cannot break out of the script tag", () => {
  const text = jsonLdText({ name: "</script><img src=x onerror=alert(1)>" });
  expect(text).not.toContain("<");
  expect(JSON.parse(text).name).toBe("</script><img src=x onerror=alert(1)>");
});

test("public page renders canonical, robots index and Open Graph tags", () => {
  const { container } = render(<Seo title="Bag" description="A bag" path="/product/1" image="/a.webp" />);
  const q = (sel) => document.head.querySelector(sel) || container.querySelector(sel);
  expect(q("link[rel=canonical]").getAttribute("href")).toBe(`${window.location.origin}/product/1`);
  expect(q("meta[name=robots]").content).toBe("index, follow");
  expect(q('meta[property="og:image"]').content).toBe(`${window.location.origin}/a.webp`);
  expect(document.title).toBe("Bag - Veyra");
});

test("MetaDAta pages are noindex and carry no canonical or social tags", () => {
  render(<MetaDAta title="Cart" />);
  expect(document.querySelector("meta[name=robots]").content).toBe("noindex, nofollow");
  expect(document.querySelector("link[rel=canonical]")).toBeNull();
  expect(document.querySelector('meta[property="og:title"]')).toBeNull();
});
