const mongoose = require("mongoose");
const validator = require("validator");
const userRoles = require("../utils/user.roles");
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

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
    enum: [userRoles.ADMIN, userRoles.MANGER, userRoles.USER],
    default: userRoles.USER,
  },
});

module.exports = mongoose.model("User", userSchema);
