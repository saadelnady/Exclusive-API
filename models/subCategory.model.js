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
      default: "uploads/subCategory-default.png",
    },
    category: {
      type: objectId,
      ref: "Category",
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Subcategory", subcategorySchema);
