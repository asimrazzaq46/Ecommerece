import { useEffect } from "react";
export default function MetaDAta({title}) {
  useEffect(() => { document.title = (title || "Shop") + " - Veyra" /* UPDATED: brand */; }, [title]);
  return null;
}
