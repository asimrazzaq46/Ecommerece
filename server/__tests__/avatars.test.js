const cloudinary = require("cloudinary");
const { saveAvatar, removeAvatar } = require("../utils/avatarStorage");
const User = require("../models/user");
const { response } = require("./helpers");
const image =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=";
test("avatars upload to Cloudinary and delete using their returned identifier", async () => {
  cloudinary.v2.uploader.upload.mockResolvedValue({
    public_id: "avatars/fixture",
    secure_url: "https://res.cloudinary.com/fixture/image.png",
  });
  cloudinary.v2.uploader.destroy.mockResolvedValue({ result: "ok" });
  const avatar = await saveAvatar(image);
  expect(avatar.provider).toBe("cloudinary");
  expect(cloudinary.v2.uploader.upload).toHaveBeenCalledWith(image, {
    folder: "avatars",
    width: 150,
    crop: "scale",
  });
  await removeAvatar(avatar);
  expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledWith(
    "avatars/fixture",
  );
});
test("invalid image bytes are rejected before upload", async () => {
  await expect(saveAvatar("data:image/png;base64,YQ==")).rejects.toMatchObject({
    statusCode: 400,
  });
  expect(cloudinary.v2.uploader.upload).not.toHaveBeenCalled();
});
test("registration works without a custom avatar", async () => {
  const create = jest
    .spyOn(User, "create")
    .mockResolvedValue({ getJwtToken: () => "fixture-token" });
  const res = response();
  res.cookie = jest.fn(() => res);
  const next = jest.fn();
  await require("../controllers/authController").registerUser(
    {
      body: {
        name: "Buyer",
        email: "buyer@example.test",
        password: "fixture-password",
      },
    },
    res,
    next,
  );
  expect(next).not.toHaveBeenCalled();
  expect(create).toHaveBeenCalledWith(
    expect.objectContaining({
      avatar: expect.objectContaining({ provider: "default" }),
    }),
  );
  expect(cloudinary.v2.uploader.upload).not.toHaveBeenCalled();
});
test("failed registration cleans up a newly uploaded Cloudinary avatar", async () => {
  cloudinary.v2.uploader.upload.mockResolvedValue({
    public_id: "avatars/failed-registration",
    secure_url: "https://example.test/avatar.png",
  });
  cloudinary.v2.uploader.destroy.mockResolvedValue({ result: "ok" });
  jest.spyOn(User, "create").mockRejectedValue(new Error("Duplicate email"));
  const next = jest.fn();
  await require("../controllers/authController").registerUser(
    { body: { avatar: image } },
    response(),
    next,
  );
  expect(next).toHaveBeenCalled();
  expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledWith(
    "avatars/failed-registration",
  );
});
test("Cloudinary permission failures become an actionable upload error", async () => {
  cloudinary.v2.uploader.upload.mockRejectedValue({
    http_code: 403,
    message: "UnexpectedResponse",
  });
  await expect(saveAvatar(image)).rejects.toMatchObject({
    statusCode: 502,
    message: expect.stringContaining("permissions"),
  });
});
