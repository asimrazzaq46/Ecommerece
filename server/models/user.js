const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter Your Name"],
    maxlength: [30, "Your Name Cannot Exceed 30 Charecters"],
  },
  email: {
    type: String,
    required: [true, "Please enter Your Email"],
    unique: true,
    validate: [validator.isEmail, "please enter a valid email address"],
  },
  password: {
    type: String,
    required: [true, "Please enter the password"],
    minlength: [6, "your password must be 6 charecters long"],
    select: false,
  },
  avatar: {
    provider: {type: String, enum: ["cloudinary", "default"], default: "cloudinary"},
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  role: {
    type: String,
    default: "user",
    enum: ["user", "admin"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  sessionVersion: { type: Number, default: 0 },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

userSchema.set("toJSON", {
  transform(doc, user) {
    delete user.password;
    delete user.sessionVersion;
    delete user.resetPasswordToken;
    delete user.resetPasswordExpire;
    return user;
  },
});

// FIRST METHOD TO ENCRYPT THE PASSWORD with bcrypjs

// // Encrypting Password before Saving the User
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  if (!this.isNew) this.sessionVersion = (this.sessionVersion || 0) + 1;
  this.password = await bcrypt.hash(this.password, 10);
});

// COMPARE THE PASSSWORDS PROVIDED BY THE USER AND INSIDE THE DATABASE

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// RETURN JWT TOKEN

userSchema.methods.getJwtToken = function () {
  // this id we are going to use for decode the token and find the user by his id ==> ../middlewares/auth.js
  return jwt.sign({ id: this._id, sessionVersion: this.sessionVersion || 0 }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_TIME,
  });
};

// Generating Forget Password tokeen of the User

userSchema.methods.getResetPasswordToken = function () {
  // Generate Token
  const resetToken = crypto.randomBytes(20).toString("hex");

  //   Hash and set to resetPasswordToken to userSchema on Line 44
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set Token Expire Time

  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("Users", userSchema);
