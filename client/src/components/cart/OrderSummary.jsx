import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatPrice } from "../../i18n";

// UPDATED: shared checkout sidebar (Shipping, Review, Payment, Success).
// `totals` are display values; the payment amount is always set by the server.
export default function OrderSummary({ items = [], totals, showItems = true, editable = true, note, children }) {
  const { t } = useTranslation();
  const count = items.reduce((acc, item) => acc + Number(item.quantity), 0);
  return (
    <aside className="vx-card vx-summary" aria-labelledby="order-summary-title">
      <div className="vx-summary-head">
        <h2 id="order-summary-title" className="vx-title-sm">{t("checkout.summary.title")}</h2>
        <span className="vx-summary-count">{t("checkout.summary.items", { count })}</span>
        {editable && (
          <Link to="/cart" className="vx-summary-edit">
            {t("checkout.summary.edit")}
          </Link>
        )}
      </div>

      {showItems && (
        <ul className="vx-summary-items">
          {items.map((item) => (
            <li key={item.product}>
              <span className="vx-summary-thumb">
                <img src={item.image} alt="" />
              </span>
              <span className="vx-summary-name">{item.name}</span>
              <span className="vx-summary-meta">
                <span>{t("checkout.summary.qty", { count: item.quantity })}</span>
                <strong>{formatPrice(item.price * item.quantity)}</strong>
              </span>
            </li>
          ))}
        </ul>
      )}

      <dl className="vx-summary-lines">
        <div>
          <dt>{t("checkout.summary.subtotal")}</dt>
          <dd>{formatPrice(totals.itemsPrice)}</dd>
        </div>
        <div>
          <dt>{t("checkout.summary.shipping")}</dt>
          <dd className={Number(totals.shippingPrice) === 0 ? "is-free" : ""}>
            {Number(totals.shippingPrice) === 0 ? t("checkout.summary.free") : formatPrice(totals.shippingPrice)}
          </dd>
        </div>
        <div>
          <dt>{t("checkout.summary.tax")}</dt>
          <dd>{formatPrice(totals.taxPrice)}</dd>
        </div>
      </dl>
      <div className="vx-summary-total">
        <span>{t("checkout.summary.total")}</span>
        <strong>{formatPrice(totals.totalPrice)}</strong>
      </div>
      {note && <p className="vx-summary-note">{note}</p>}
      {children}
    </aside>
  );
}
