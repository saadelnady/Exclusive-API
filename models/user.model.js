const mongoose = require("mongoose");
const validator = require("validator");
const roles = require("../utils/roles");

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
    address: { type: String, default: "" },
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
    cart: [{ type: mongoose.Types.ObjectId, ref: "Cart" }],
    role: {
      type: String,
      enum: [roles.ADMIN, roles.USER],
      default: roles.USER,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
