import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Checkout.css";

// UPDATED: Veyra 4-step progress bar (Cart → Shipping → Review → Payment). Same props as before;
// completed steps stay clickable so the shopper can go back and edit.
const STEPS = [
  { key: "cart", path: "/cart" },
  { key: "shipping", path: "/shipping" },
  { key: "confirm", path: "/confirm" },
  { key: "payment", path: "/payment" },
];

export default function CheckoutSteps({ shipping, ConfirmOrder, payment }) {
  const { t } = useTranslation();
  const current = payment ? 3 : ConfirmOrder ? 2 : shipping ? 1 : 0;
  return (
    <nav aria-label={t("checkout.steps.label")} className="vx-steps">
      <ol className="vx-container vx-steps-list">
        {STEPS.map((step, index) => {
          const state = index < current ? "done" : index === current ? "active" : "todo";
          const content = (
            <>
              <span className="vx-step-dot" aria-hidden="true">
                {state === "done" ? <i className="fa fa-check" /> : index + 1}
              </span>
              <span className="vx-step-text">
                <span className="vx-step-num">{t("checkout.steps.step", { n: String(index + 1).padStart(2, "0") })}</span>
                <span className="vx-step-label">{t(`checkout.steps.${step.key}`)}</span>
              </span>
            </>
          );
          return (
            <li key={step.key} className={`vx-step is-${state}`} aria-current={state === "active" ? "step" : undefined}>
              {state === "done" ? <Link to={step.path}>{content}</Link> : <span>{content}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
