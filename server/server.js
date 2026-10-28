if (process.argv.includes("--production")) process.env.NODE_ENV = "production";
const app = require("./app");
const connectDatabase = require("./config/database");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

let server;
async function startServer() {
  require("./utils/validateEnvironment")();
  await connectDatabase();
  if (String(process.env.NODE_ENV).toLowerCase() === "production") {
    await require("./utils/transaction").requireTransactions();
    const info = await mongoose.connection.db.admin().command({buildInfo:1});
    if (info.versionArray[0] < 7) throw new Error("Production requires a supported MongoDB server version (7 or newer)");
  }
  server = app.listen(process.env.PORT || 3002, () => {
    console.log("Server started on port " + server.address().port + " in " + (process.env.NODE_ENV || "development") + " mode.");
  });
  return server;
}

function shutdown(error) {
  console.error("Server stopped:", error.name || "Error");
  if (String(process.env.NODE_ENV).toLowerCase() === "development") console.error(error.message);
  const timer = setTimeout(() => process.exit(1), 5000);
  timer.unref();
  const close = () => mongoose.disconnect().finally(() => process.exit(1));
  if (server) server.close(close);
  else close();
}

if (require.main === module) {
  process.on("uncaughtException", shutdown);
  process.on("unhandledRejection", shutdown);
  startServer().catch(shutdown);
}
module.exports = startServer;
