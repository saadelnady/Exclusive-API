const mongoose = require("mongoose");
const objectId = mongoose.Types.ObjectId;

const subcategorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: "uploads/subCategories/subCategory-default.png",
    },
    category: {
      type: objectId,
      ref: "Category",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Subcategory", subcategorySchema);
