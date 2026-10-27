const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

const connectDatabase = () => {
  return mongoose.connect(process.env.DB_LOCAL_URL, {
    serverSelectionTimeoutMS: 5000,
  });
};

module.exports = connectDatabase;
