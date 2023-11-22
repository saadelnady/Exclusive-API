const mongoose = require("mongoose");
const validator = require("validator");
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
});

module.exports = mongoose.model("User", userSchema);
