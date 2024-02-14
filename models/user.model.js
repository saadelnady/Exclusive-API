const mongoose = require("mongoose");
const validator = require("validator");
const userRoles = require("../utils/user.roles");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    image: { type: String, default: "uploads/user-default.png" },
    mobilePhone: { type: String, unique: true, required: true },
    address: { type: String },
    email: {
      type: String,
      validator: [validator.isEmail, "Email must be valid email"],
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    token: { type: String },
    role: {
      type: String,
      enum: [userRoles.ADMIN, userRoles.SELLER, userRoles.USER],
      default: userRoles.USER,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
