import Seo from "./Seo";
// UPDATED: title for pages that must not be indexed (account, checkout, admin, auth, 404). Public pages use <Seo>.
export default function MetaDAta({ title }) {
  return <Seo title={title} noindex />;
}
