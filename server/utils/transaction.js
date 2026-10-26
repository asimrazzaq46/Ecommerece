const mongoose = require("mongoose");
const ErrorHandler = require("./errorHandler");

exports.requireTransactions = async () => {
  if (!mongoose.connection.db) throw new ErrorHandler("Database is unavailable. Please try again later", 503);
  const topology = await mongoose.connection.db.admin().command({ isMaster: 1 });
  if (!topology.setName && topology.msg !== "isdbgrid") {
    throw new ErrorHandler("Checkout requires a MongoDB replica set or Atlas database", 503);
  }
};

exports.inTransaction = async work => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => { result = await work(session); });
    return result;
  } finally {
    await session.endSession();
  }
};
