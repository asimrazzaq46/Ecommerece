module.exports = () => ({
  httpOnly: true,
  secure: String(process.env.NODE_ENV).toLowerCase() === "production",
  sameSite: "lax",
  path: "/",
});
