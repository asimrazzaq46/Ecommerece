import React, { useMemo, useState } from "react";
import Pagination from "./Pagination";
const text = (value) => {
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (Array.isArray(value)) return value.map(text).join(" ");
  if (React.isValidElement(value)) return text(value.props.children);
  return "";
};
export default function DataTable({ data, className = "" }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ field: "", direction: 1 });
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const rows = useMemo(() => {
    const filtered = data.rows.filter((row) =>
      data.columns.some((column) =>
        text(row[column.field]).toLowerCase().includes(search.toLowerCase()),
      ),
    );
    if (sort.field)
      filtered.sort((a, b) => {
        const av = text(a[sort.field]),
          bv = text(b[sort.field]);
        const an = Number(av.replace(/^\$/, "")),
          bn = Number(bv.replace(/^\$/, ""));
        return (
          sort.direction *
          (av && bv && Number.isFinite(an) && Number.isFinite(bn)
            ? an - bn
            : av.localeCompare(bv, undefined, { numeric: true }))
        );
      });
    return filtered;
  }, [data, search, sort]);
  const current = Math.min(page, Math.max(1, Math.ceil(rows.length / size)));
  return (
    <div className={className}>
      <div className="d-flex justify-content-between mb-3">
        <label>
          Search{" "}
          <input
            className="form-control"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          Rows per page{" "}
          <select
            className="form-control"
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[10, 25, 50].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="table-responsive">
        <table className="table table-bordered table-striped table-hover">
          <thead>
            <tr>
              {data.columns.map((column) => (
                <th
                  key={column.field}
                  scope="col"
                  aria-sort={
                    sort.field === column.field
                      ? sort.direction === 1
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  {column.sort ? (
                    <button
                      className="btn btn-link p-0"
                      onClick={() =>
                        setSort({
                          field: column.field,
                          direction:
                            sort.field === column.field ? -sort.direction : 1,
                        })
                      }
                    >
                      {column.label}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice((current - 1) * size, current * size).map((row, i) => (
              <tr key={row.id || i}>
                {data.columns.map((column) => (
                  <td key={column.field}>{row[column.field]}</td>
                ))}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={data.columns.length}>No records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        activePage={current}
        itemsCountPerPage={size}
        totalItemsCount={rows.length}
        onChange={setPage}
      />
    </div>
  );
}
