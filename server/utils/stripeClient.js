let client;
module.exports = () => {
  if (!client) client = require("stripe")(process.env.STRIPE_SECRET_KEY);
  return client;
};
