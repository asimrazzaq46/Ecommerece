import React, { useEffect, useState } from "react";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import Payment from "./Payment";

export default function PaymentPage(props) {
  const [stripe, setStripe] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
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
  if (error) return <div role="alert">{error} <button onClick={() => setAttempt(value => value + 1)}>Retry</button></div>;
  if (!stripe) return <p role="status">Loading payment form...</p>;
  return <Elements stripe={stripe}><Payment {...props} /></Elements>;
}
