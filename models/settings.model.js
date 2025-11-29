const mongoose = require("mongoose");
const validator = require("validator");

const socialSchema = new mongoose.Schema(
  {
    image: { type: String },
    title: {
      ar: { type: String },
      en: { type: String },
    },
    link: { type: String },
  },
  { _id: true }
);

const settingsSchema = new mongoose.Schema(
  {
    appName: {
      ar: { type: String, required: true },
      en: { type: String, required: true },
    },
    logo: {
      type: String,
    },
    favIcon: {
      type: String,
    },
    phone: { type: String, unique: true },
    address: {
      ar: { type: String },
      en: { type: String },
    },
    email: {
      type: String,
      unique: true,
      validate: [validator.isEmail, "Email must be valid email"],
    },
    socials: [socialSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Settings", settingsSchema);
