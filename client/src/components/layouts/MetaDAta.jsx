import { useEffect } from "react";
export default function MetaDAta({title}) {
  useEffect(() => { document.title = (title || "Shop") + " - ShopIT"; }, [title]);
  return null;
}
