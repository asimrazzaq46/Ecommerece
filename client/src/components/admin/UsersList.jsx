import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useAlert } from "../ui/Alerts";
import Pagination from "../ui/Pagination";
import ConfirmDialog from "../ui/ConfirmDialog";

import { allUsers, allOrders, deleteUser, clearError } from "../../actions";
import { formatPrice, translateServerError } from "../../i18n";
import MetaDAta from "../layouts/MetaDAta";
import AdminLayout from "./AdminLayout";
import AdminHead, { Kpi } from "./AdminHead";
import { DELETE_USER_RESET } from "../../constants/userConstants";
import "./ProductAdmin.css";

const PAGE_SIZE = 10;
const ROLES = ["user", "admin"];

// UPDATED: Veyra users management (Stitch users management). Orders and spend are summed from real orders.
const UsersList = () => {
  const alert = useAlert();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();

  const { error, loading, users = [] } = useSelector((state) => state.allUsers);
  const { orders = [] } = useSelector((state) => state.allOrders);
  const { isDeleted, error: deleteError } = useSelector((state) => state.user);
  const me = useSelector((state) => state.auth.user);

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Newest");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(allUsers());
    dispatch(allOrders());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      alert.error(translateServerError(t, error));
      dispatch(clearError());
    }
    if (deleteError) {
      alert.error(translateServerError(t, deleteError));
      dispatch(clearError());
      setDeleting(false);
    }
    if (isDeleted) {
      alert.success(t("adminUsers.list.deleted"));
      dispatch({ type: DELETE_USER_RESET });
      dispatch(allUsers());
      setDeleting(false);
      setToDelete(null);
    }
  }, [dispatch, alert, error, deleteError, isDeleted, t]);

  const stats = useMemo(() => {
    const byUser = new Map();
    orders.forEach((o) => {
      const id = o.user?._id;
      if (!id) return;
      const row = byUser.get(id) || { count: 0, spent: 0 };
      row.count += 1;
      row.spent += Number(o.totalPrice || 0);
      byUser.set(id, row);
    });
    return byUser;
  }, [orders]);

  const now = new Date();
  const counts = {
    all: users.length,
    user: users.filter((u) => u.role !== "admin").length,
    admin: users.filter((u) => u.role === "admin").length,
  };
  const newThisMonth = users.filter((u) => {
    const d = new Date(u.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users
      .filter((u) => tab === "all" || (tab === "admin" ? u.role === "admin" : u.role !== "admin"))
      .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u._id.toLowerCase().includes(q))
      .sort((a, b) => (sort === "Name" ? a.name.localeCompare(b.name) : new Date(b.createdAt) - new Date(a.createdAt)));
  }, [users, tab, search, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const filtered = tab !== "all" || search.trim() !== "";
  const reset = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  return (
    <Fragment>
      <MetaDAta title={t("adminUsers.list.pageTitle")} />
      <AdminLayout title={t("admin.nav.users")}>
        <AdminHead crumbs={[{ label: t("adminUsers.list.title") }]} title={t("adminUsers.list.title")} subtitle={t("adminUsers.list.subtitle")} />

        <div className="vx-kpis">
          <Kpi icon="fa-users" label={t("adminUsers.list.kpiTotal")} value={loading ? "…" : counts.all} />
          <Kpi icon="fa-user-plus" label={t("adminUsers.list.kpiNew")} value={loading ? "…" : newThisMonth} />
          <Kpi icon="fa-user-o" label={t("adminUsers.list.kpiCustomers")} value={loading ? "…" : counts.user} />
          <Kpi icon="fa-shield" label={t("adminUsers.list.kpiAdmins")} value={loading ? "…" : counts.admin} />
        </div>

        <section className="vx-card vx-pm-card">
          <div className="vx-pm-tools">
            <div className="vx-pm-tabs" role="group" aria-label={t("adminUsers.list.role")}>
              {["all", ...ROLES].map((key) => (
                <button key={key} type="button" aria-pressed={tab === key} className={tab === key ? "is-active" : ""} onClick={() => reset(setTab)(key)}>
                  {t(`adminUsers.list.tab${key === "all" ? "All" : key === "user" ? "User" : "Admin"}`)} <span>{counts[key]}</span>
                </button>
              ))}
            </div>
            <div className="vx-pm-filters vx-pm-filters--two">
              <div className="vx-pm-search">
                <i className="fa fa-search" aria-hidden="true" />
                <input type="search" className="vx-control" aria-label={t("adminUsers.list.searchPlaceholder")} placeholder={t("adminUsers.list.searchPlaceholder")} value={search} onChange={(e) => reset(setSearch)(e.target.value)} />
              </div>
              <select className="vx-control" aria-label={t("adminUsers.list.sortLabel")} value={sort} onChange={(e) => reset(setSort)(e.target.value)}>
                <option value="Newest">{t("adminUsers.list.sortNewest")}</option>
                <option value="Name">{t("adminUsers.list.sortName")}</option>
              </select>
            </div>
          </div>

          {error ? (
            <div className="vx-state" role="alert">
              <span className="vx-state-icon"><i className="fa fa-exclamation-triangle" aria-hidden="true" /></span>
              <p>{t("adminUsers.list.loadError")}</p>
              <button type="button" className="vx-btn vx-btn--primary" onClick={() => dispatch(allUsers())}>{t("adminUsers.list.retry")}</button>
            </div>
          ) : loading ? (
            <p className="vx-chart-empty" role="status">…</p>
          ) : users.length === 0 ? (
            <div className="vx-state"><h2 className="vx-title-md">{t("adminUsers.list.emptyTitle")}</h2></div>
          ) : rows.length === 0 ? (
            <div className="vx-state">
              <span className="vx-state-icon"><i className="fa fa-search" aria-hidden="true" /></span>
              <p>{t("adminUsers.list.noMatch")}</p>
              {filtered && <button type="button" className="vx-btn vx-btn--soft" onClick={() => { setTab("all"); setSearch(""); setPage(1); }}>{t("adminUsers.list.clearFilters")}</button>}
            </div>
          ) : (
            <>
              <div className="vx-table-wrap">
                <table className="vx-table vx-pm-table">
                  <thead>
                    <tr>
                      <th>{t("adminUsers.list.user")}</th>
                      <th>{t("adminUsers.list.role")}</th>
                      <th>{t("adminUsers.list.joined")}</th>
                      <th>{t("adminUsers.list.orders")}</th>
                      <th>{t("adminUsers.list.spent")}</th>
                      <th><span className="vx-sr-only">{t("adminUsers.list.actions")}</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((user) => {
                      const isMe = me && String(me._id) === String(user._id);
                      const isAdmin = user.role === "admin";
                      const stat = stats.get(user._id) || { count: 0, spent: 0 };
                      const blocked = isMe ? t("adminUsers.list.deleteBlockedSelf") : isAdmin ? t("adminUsers.list.deleteBlockedAdmin") : "";
                      return (
                        <tr key={user._id}>
                          <td>
                            <span className="vx-pm-product">
                              <img className="vx-user-avatar" src={user.avatar?.url || "/images/default_avatar.jpg"} alt="" />
                              <span>
                                <span className="vx-cell-main">{user.name}{isMe && <span className="vx-you"> · {t("adminUsers.list.you")}</span>}</span>
                                <span className="vx-cell-sub">{user.email}</span>
                              </span>
                            </span>
                          </td>
                          <td><span className={`vx-role is-${isAdmin ? "admin" : "user"}`}>{t(`adminUsers.roles.${isAdmin ? "admin" : "user"}`)}</span></td>
                          <td>{new Date(user.createdAt).toLocaleDateString(i18n.language, { dateStyle: "medium" })}</td>
                          <td>{t("adminUsers.list.ordersCount", { count: stat.count })}</td>
                          <td className="vx-cell-main">{formatPrice(stat.spent)}</td>
                          <td>
                            <span className="vx-pm-actions">
                              <Link to={`/admin/user/${user._id}`} className="vx-icon-btn" aria-label={t("adminUsers.list.editNamed", { name: user.name })} title={t("adminUsers.list.edit")}>
                                <i className="fa fa-pencil" aria-hidden="true" />
                              </Link>
                              <button
                                type="button"
                                className="vx-icon-btn vx-icon-btn--danger"
                                aria-label={t("adminUsers.list.deleteNamed", { name: user.name })}
                                title={blocked || t("adminUsers.list.delete")}
                                disabled={Boolean(blocked)}
                                onClick={() => setToDelete(user)}
                              >
                                <i className="fa fa-trash-o" aria-hidden="true" />
                              </button>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="vx-pm-foot">
                <span className="vx-muted">{t("adminUsers.list.showing", { from: (current - 1) * PAGE_SIZE + 1, to: Math.min(current * PAGE_SIZE, rows.length), total: rows.length })}</span>
                <Pagination activePage={current} itemsCountPerPage={PAGE_SIZE} totalItemsCount={rows.length} onChange={setPage} />
              </div>
            </>
          )}
        </section>
      </AdminLayout>

      <ConfirmDialog
        open={Boolean(toDelete)}
        busy={deleting}
        title={t("adminUsers.list.confirmTitle")}
        text={toDelete ? t("adminUsers.list.confirmText", { name: toDelete.name, email: toDelete.email }) : ""}
        confirmLabel={t(deleting ? "adminUsers.list.deleting" : "adminUsers.list.confirmDelete")}
        cancelLabel={t("adminUsers.list.confirmCancel")}
        onConfirm={() => { setDeleting(true); dispatch(deleteUser(toDelete._id)); }}
        onCancel={() => setToDelete(null)}
      />
    </Fragment>
  );
};

export default UsersList;
