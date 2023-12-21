const mongoose = require("mongoose");
const validator = require("validator");
const userRoles = require("../utils/user.roles");

const sellerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  userImage: { type: String, default: "uploads/users/user-default.png" },
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
  role: { type: String, default: userRoles.SELLER },
});

module.exports = mongoose.model("Seller", sellerSchema);
