const path = require("path");
const readline = require("readline");
const mongoose = require("mongoose");
const validator = require("validator");

require("dotenv").config({
  path: path.resolve(__dirname, "../config/config.env"),
  quiet: true,
});

const User = require("../models/user");

// Reads a line; when hidden, typed characters are not echoed (used for the password).
function ask(question, hidden = false) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  if (hidden)
    rl._writeToOutput = (text) => {
      if (text.startsWith(question)) rl.output.write(text);
    };

  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer);
    }),
  );
}

async function main() {
  try {
    const args = process.argv.slice(2);
    if (args.some((arg) => arg !== "--promote"))
      throw new Error("Usage: npm run create-admin -- [--promote]");

    if (!process.env.DB_LOCAL_URL)
      throw new Error("DB_LOCAL_URL is required in server/config/config.env");

    const email = (process.env.ADMIN_EMAIL || (await ask("Admin email: ")))
      .trim()
      .toLowerCase();

    if (!validator.isEmail(email)) throw new Error("A valid email is required");

    await mongoose.connect(process.env.DB_LOCAL_URL, {
      serverSelectionTimeoutMS: 5000,
    });

    const existing = await User.findOne({ email });

    if (existing) {
      if (existing.role === "admin")
        return console.log(
          "An admin with this email already exists. Nothing was changed.",
        );

      if (!args.includes("--promote"))
        throw new Error(
          "A regular user with this email exists. Re-run with --promote to grant admin (password is not changed).",
        );

      await User.updateOne({ _id: existing._id }, { $set: { role: "admin" } });

      return console.log("Existing user promoted to admin.");
    }

    const name = (process.env.ADMIN_NAME || (await ask("Admin name: "))).trim();

    const password =
      process.env.ADMIN_PASSWORD ||
      (await ask("Admin password (min 8 chars, hidden): ", true));

    if (!name || name.length > 30)
      throw new Error("Name is required (max 30 characters)");

    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72)
      throw new Error("Password must be 8-72 characters");

    // The User pre-save hook hashes the password with bcrypt.
    await User.create({
      name,
      email,
      password,
      role: "admin",
      avatar: {
        public_id: "default-avatar",
        url: "/images/default_avatar.jpg",
        provider: "default",
      },
    });

    console.log("Admin account created for " + email);
  } catch (error) {
    console.error(
      "Create admin failed:",
      error.name === "MongooseServerSelectionError"
        ? "Cannot connect to MongoDB. Check DB_LOCAL_URL and mongod."
        : error.message,
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
if (require.main === module) main();
