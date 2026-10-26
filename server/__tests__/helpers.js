exports.response = () => ({
  status: jest.fn().mockReturnThis(),
  cookie: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});
