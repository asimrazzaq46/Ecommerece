const cloudinary = require("cloudinary").v2;
const ErrorHandler = require("./errorHandler");
async function saveAvatar(data) {
  if (!data)
    return {
      public_id: "default-avatar",
      url: "/images/default_avatar.jpg",
      provider: "default",
    };
  const match =
    /^data:image\/(png|jpe?g|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(
      data,
    );
  if (!match)
    throw new ErrorHandler(
      "Please choose a PNG, JPEG, GIF or WebP avatar",
      400,
    );
  const bytes = Buffer.from(match[2], "base64");
  const type = match[1].toLowerCase().replace("jpeg", "jpg");
  const valid =
    type === "png"
      ? bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))
      : type === "jpg"
        ? bytes.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex"))
        : type === "gif"
          ? /^GIF8[79]a$/.test(bytes.toString("ascii", 0, 6))
          : bytes.toString("ascii", 0, 4) === "RIFF" &&
            bytes.toString("ascii", 8, 12) === "WEBP";
  if (!valid || bytes.length > 5 * 1024 * 1024)
    throw new ErrorHandler("Avatar must be a valid image under 5 MB", 400);

  try {
    const result = await cloudinary.uploader.upload(data, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });
    return {
      public_id: result.public_id,
      url: result.secure_url,
      provider: "cloudinary",
    };
  } catch (error) {
    if (error.http_code === 403)
      throw new ErrorHandler(
        "Cloudinary rejected avatar uploads. Check create/upload permissions.",
        502,
      );
    throw error;
  }
}
async function removeAvatar(avatar) {
  if (!avatar?.public_id || avatar.provider === "default") return;
  return cloudinary.uploader.destroy(avatar.public_id);
}
module.exports = { saveAvatar, removeAvatar };
