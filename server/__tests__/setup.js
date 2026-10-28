process.env.NODE_ENV = "PRODUCTION";
process.env.JWT_SECRET = "unit-test-secret-not-for-deployment";
process.env.JWT_EXPIRES_TIME = "1h";
process.env.COOKIE_EXPIRES_TIME = "1";

// Fail closed if a test accidentally reaches a real service or database.
jest.mock("mongoose", () => {
  const mongoose = jest.requireActual("mongoose");
  mongoose.set("bufferCommands", false);
  mongoose.connect = jest.fn(() => { throw new Error("Real database connections are forbidden in unit tests"); });
  mongoose.createConnection = jest.fn(() => { throw new Error("Real database connections are forbidden in unit tests"); });
  return mongoose;
});
jest.mock("dotenv", () => ({ config: jest.fn() }));
jest.mock("cloudinary", () => ({
  v2: { uploader: {
    upload: jest.fn(() => { throw new Error("Mock the upload explicitly"); }),
    destroy: jest.fn(() => { throw new Error("Mock the deletion explicitly"); }),
  } },
}));
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => { throw new Error("Mock email explicitly"); }),
}));
jest.mock("stripe", () => jest.fn(() => ({
  paymentIntents: {
    create: jest.fn(() => { throw new Error("Mock payment creation explicitly"); }),
    retrieve: jest.fn(() => { throw new Error("Mock payment retrieval explicitly"); }),
  },
})));

jest.mock("../middlewares/requestSecurity", () => ({headers:(req,res,next)=>next(),origin:(req,res,next)=>next(),limit:(req,res,next)=>next()}));
