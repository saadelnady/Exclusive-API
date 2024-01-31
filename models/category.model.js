const mongoose = require("mongoose");
const categorySchema = new mongoose.Schema(
  {
    categoryImage: {
      type: String,
      default: "uploads/categories/category-default.png",
    },
    categoryTitle: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Category", categorySchema);
