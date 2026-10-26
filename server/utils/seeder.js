const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../config/config.env") });
const seedProducts = require("./seedProducts");

async function main() {
  try {
    const args = process.argv.slice(2);
    if (args.some(arg => arg !== "--dry-run")) throw new Error("Usage: npm run seeder -- [--dry-run]");
    if (!process.env.DB_LOCAL_URL) throw new Error("DB_LOCAL_URL is required");
    await mongoose.connect(process.env.DB_LOCAL_URL, { useNewUrlParser: true, useUnifiedTopology: true, serverSelectionTimeoutMS: 5000 });
    const result = await seedProducts({ userId: process.env.SEED_USER_ID, dryRun: args.includes("--dry-run") });
    console.log("Product seed:", JSON.stringify(result));
  } catch (error) {
    console.error("Product seed failed:", error.name === "MongoNetworkError" || error.name === "MongooseServerSelectionError" ? "Cannot connect to MongoDB. Check DB_LOCAL_URL and mongod." : error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
if (require.main === module) main();
