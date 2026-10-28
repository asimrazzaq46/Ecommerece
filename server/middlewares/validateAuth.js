const validator = require("validator");
const ErrorHandler = require("../utils/errorHandler");

const text = value => typeof value === "string" && value.trim().length > 0;
const email = value => text(value) && validator.isEmail(value);
const name = value => text(value) && value.length <= 30;
const password = value => typeof value === "string" && value.length >= 6 && Buffer.byteLength(value, "utf8") <= 72;
const avatar = value => typeof value === "string" && value.length <= 7 * 1024 * 1024 &&
  /^data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+/]+={0,2}$/i.test(value);

const rules = {
  register: { name, email, password, avatar: value => value === undefined || value === "" || avatar(value) },
  login: { email, password: text },
  forgot: { email },
  reset: { password, confirmPassword: password },
  password: { oldPassword: text, password },
  profile: { name, email, avatar: value => value === undefined || value === "" || avatar(value) },
  admin: { name, email, role: value => ["user", "admin"].includes(value) },
};

module.exports = action => (req, res, next) => {
  const body = req.body || {};
  for (const [field, valid] of Object.entries(rules[action])) {
    if (!valid(body[field])) {
      return next(new ErrorHandler(`Please provide a valid ${field}`, 400));
    }
  }
  next();
};
