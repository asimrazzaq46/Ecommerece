import React from "react";
export const Elements = ({ children }) => children;
const stripe = {
  confirmCardPayment: async (secret) => ({
    paymentIntent: { id: secret.split("_secret_")[0], status: "succeeded" },
  }),
};
const elements = { getElement: () => ({}) };
export const useStripe = () => stripe;
export const useElements = () => elements;
export const CardNumberElement = ({ id, className }) => (
  <input
    id={id}
    className={className}
    placeholder="Simulated card — no real payment"
    readOnly
  />
);
export const CardExpiryElement = ({ id, className }) => (
  <input id={id} className={className} value="12/30" readOnly />
);
export const CardCvcElement = ({ id, className }) => (
  <input id={id} className={className} value="123" readOnly />
);
