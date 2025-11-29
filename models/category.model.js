const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    image: {
      type: String,
      default: function () {
        return `${process.env.BASE_URL}/uploads/category-default.png`;
      },
    },
    title: {
      ar: { type: String, required: true },
      en: { type: String, required: true },
    },
    subCategories: [{ type: mongoose.Types.ObjectId, ref: "Subcategory" }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Category", categorySchema);
