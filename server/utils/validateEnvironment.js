module.exports = (env = process.env) => {
  if (String(env.NODE_ENV).toLowerCase() !== "production") return;
  const missing = ["DB_LOCAL_URL","JWT_SECRET","STRIPE_SECRET_KEY","STRIPE_API_KEY","STRIPE_WEBHOOK_SECRET","CLOUDINARY_CLOUD_NAME","CLOUDINARY_API_KEY","CLOUDINARY_API_SECRET","FRONTEND_URL"].filter(key=>!env[key]);
  if(missing.length) throw new Error("Missing production settings: " + missing.join(", "));
  if(env.JWT_SECRET.length<32) throw new Error("Production JWT_SECRET must be at least 32 characters");
  if(new URL(env.FRONTEND_URL).protocol!=="https:") throw new Error("Production FRONTEND_URL must use HTTPS");
  const uri = new URL(env.DB_LOCAL_URL);
  if (!uri.username || !uri.password) throw new Error("Production database requires authentication");
  if (uri.protocol!=="mongodb+srv:" && uri.searchParams.get("tls")!=="true") throw new Error("Production database requires TLS");
  if (uri.searchParams.get("tlsAllowInvalidCertificates")==="true" || uri.searchParams.get("tlsInsecure")==="true") throw new Error("Production database TLS verification cannot be disabled");
};
