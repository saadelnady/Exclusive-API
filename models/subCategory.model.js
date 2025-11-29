const mongoose = require("mongoose");
const subcategorySchema = new mongoose.Schema(
  {
    title: {
      ar: { type: String, required: true },
      en: { type: String, required: true },
    },
    image: {
      type: String,
      default: function () {
        return `${process.env.BASE_URL}/uploads/subCategory-default.png`;
      },
    },
    category: {
      type: mongoose.Types.ObjectId,
      ref: "Category",
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Subcategory", subcategorySchema);
