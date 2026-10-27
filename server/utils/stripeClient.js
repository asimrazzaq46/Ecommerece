const Stripe = require("stripe");
let client;
module.exports = () => {
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY, {
    // Keep SDK upgrades from silently changing our payment API contract.
    apiVersion: "2026-09-30.endive",
    maxNetworkRetries: 1,
    timeout: 30000,
  });
  return client;
};
