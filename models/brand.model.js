const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      default: function () {
        return `${process.env.BASE_URL}/uploads/default.png`;
      },
    },
    title: {
      ar: { type: String, required: true },
      en: { type: String, required: true },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Brand", brandSchema);
