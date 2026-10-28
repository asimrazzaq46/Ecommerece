const crypto = require("crypto");
const RateBucket = require("../models/rateBucket");
const ErrorHandler = require("../utils/errorHandler");
exports.headers = (req, res, next) => {
  res.removeHeader("X-Powered-By");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cache-Control", "no-store");
  if (String(process.env.NODE_ENV).toLowerCase() === "production") res.setHeader("Strict-Transport-Security", "max-age=31536000");
  next();
};
exports.origin = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method) && req.path !== "/logout") return next();
  const allowed = new Set([process.env.FRONTEND_URL].filter(Boolean).map(value => new URL(value).origin));
  if (String(process.env.NODE_ENV).toLowerCase() !== "production") {
    allowed.add("http://localhost:3000"); allowed.add("http://127.0.0.1:3000");
  }
  const origin = req.get("Origin");
  if ((origin && !allowed.has(origin)) || req.get("Sec-Fetch-Site") === "cross-site" || (req.cookies?.token && !origin && req.get("X-ShopIT-Request") !== "1")) return next(new ErrorHandler("Request origin is not allowed", 403));
  next();
};
exports.limit = async (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const auth = /^\/(login|register|password\/)/.test(req.path);
  const windowMs = 15 * 60 * 1000, now = Date.now(), max = auth ? 30 : 120;
  const id = crypto.createHash("sha256").update((auth ? "auth:" : "write:") + req.ip + ":" + Math.floor(now / windowMs)).digest("hex");
  try {
    const update = { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((Math.floor(now / windowMs) + 1) * windowMs) } };
    let bucket;
    try { bucket = await RateBucket.findOneAndUpdate({_id:id}, update, {upsert:true,new:true}); }
    catch (error) { if(error.code!==11000) throw error; bucket=await RateBucket.findOneAndUpdate({_id:id},update,{new:true}); }
    if (bucket.count > max) { res.setHeader("Retry-After", String(Math.ceil((windowMs - now % windowMs)/1000))); return next(new ErrorHandler("Too many requests. Please try again later",429)); }
    next();
  } catch (error) { next(error); }
};
