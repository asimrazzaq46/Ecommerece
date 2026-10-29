import React, { useEffect, useState } from "react";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useTranslation } from "react-i18next";
import Payment from "./Payment";

export default function PaymentPage(props) {
  const [stripe, setStripe] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const { t } = useTranslation();
  useEffect(() => {
    let active = true;
    setError("");
    async function load() {
      try {
        const { data } = await axios.get("/api/v1/stripeapi");
        if (!data.stripeApiKey) throw new Error("Payments are not configured");
        const client = await loadStripe(data.stripeApiKey);
        if (!client) throw new Error("Unable to load payment form");
        if (active) setStripe(client);
      } catch (err) {
        if (active) setError(err.response?.data?.Message || err.message || "Unable to load payment form");
      }
    }
    load();
    return () => { active = false; };
  }, [attempt]);
  // UPDATED: Veyra-styled, translated loading and error states
  if (error)
    return (
      <div className="vx-page vx-checkout">
        <div className="vx-container">
          <div className="vx-card vx-state vx-checkout-state" role="alert">
            <span className="vx-state-icon"><i className="fa fa-exclamation-triangle" aria-hidden="true" /></span>
            <p>{error}</p>
            <button className="vx-btn vx-btn--primary" onClick={() => setAttempt(value => value + 1)}>{t("checkout.payment.retry")}</button>
          </div>
        </div>
      </div>
    );
  if (!stripe)
    return (
      <div className="vx-page vx-checkout">
        <p role="status" className="vx-container vx-checkout-loading">{t("checkout.payment.loading")}</p>
      </div>
    );
  return <Elements stripe={stripe}><Payment {...props} /></Elements>;
}
