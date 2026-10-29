// UPDATED: one place for page metadata. React 19 hoists <title>, <meta>, <link> and <script> rendered anywhere
// into <head>, so no helmet library is needed. Public pages use <Seo>; every other page uses <MetaDAta>,
// which is Seo with noindex.
import React from "react";

const SUFFIX = " - Veyra";
// The canonical host is whatever origin serves the app, so nothing is hard-coded and localhost never leaks
// into production (the sitemap on the server uses FRONTEND_URL).
export const absoluteUrl = (path = "/") => `${window.location.origin}${path}`;

// JSON-LD sits inside a <script>; escaping "<" (and line separators) stops "</script>" in product text
// from breaking out of it.
export const jsonLdText = (data) =>
  JSON.stringify(data).replace(/[<\u2028\u2029]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));

export default function Seo({ title, description, path, image, type = "website", noindex = false, follow = false, jsonLd = [] }) {
  const fullTitle = (title || "Shop") + SUFFIX;
  const url = path ? absoluteUrl(path) : null;
  const imageUrl = image ? (/^https?:/.test(image) ? image : absoluteUrl(image)) : null;
  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <meta name="robots" content={noindex ? (follow ? "noindex, follow" : "noindex, nofollow") : "index, follow"} />
      {url && !noindex && <link rel="canonical" href={url} />}
      {!noindex && (
        <>
          <meta property="og:site_name" content="Veyra" />
          <meta property="og:type" content={type} />
          <meta property="og:title" content={fullTitle} />
          {description && <meta property="og:description" content={description} />}
          {url && <meta property="og:url" content={url} />}
          {imageUrl && <meta property="og:image" content={imageUrl} />}
          <meta name="twitter:card" content={imageUrl ? "summary_large_image" : "summary"} />
          <meta name="twitter:title" content={fullTitle} />
          {description && <meta name="twitter:description" content={description} />}
          {imageUrl && <meta name="twitter:image" content={imageUrl} />}
        </>
      )}
      {!noindex &&
        jsonLd.map((data, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(data) }} />
        ))}
    </>
  );
}
