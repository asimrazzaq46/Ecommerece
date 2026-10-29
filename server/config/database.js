const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

const connectDatabase = () => {
  // Fix: a missing config.env used to surface as an opaque MongooseError.
  if (!process.env.DB_LOCAL_URL) throw new Error("DB_LOCAL_URL is not set. Create server/config/config.env from config.env.example");
  return mongoose.connect(process.env.DB_LOCAL_URL, {
    serverSelectionTimeoutMS: 5000,
  });
};

module.exports = connectDatabase;
