jest.mock("../app", () => ({ listen: jest.fn() }));
jest.mock("../config/database", () => jest.fn());
jest.mock("cloudinary", () => ({ v2: { config: jest.fn() } }));
const app = require("../app");
const connect = require("../config/database");
const startServer = require("../server");

test("server accepts requests only after database connection succeeds", async () => {
  let ready;
  connect.mockReturnValue(new Promise(resolve => { ready = resolve; }));
  app.listen.mockReturnValue({ close: jest.fn() });
  const starting = startServer();
  expect(app.listen).not.toHaveBeenCalled();
  ready();
  await starting;
  expect(app.listen).toHaveBeenCalledTimes(1);
});

test("database startup failure never opens the HTTP listener", async () => {
  connect.mockRejectedValue(new Error("Database unavailable"));
  await expect(startServer()).rejects.toThrow("Database unavailable");
  expect(app.listen).not.toHaveBeenCalled();
});

beforeEach(() => { process.env.NODE_ENV = "development"; });
afterEach(() => { process.env.NODE_ENV = "PRODUCTION"; });
