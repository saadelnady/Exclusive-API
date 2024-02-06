const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },
    productImages: {
      type: String,
      default: "uploads/product-default.png",
    },
    productDescription: { type: String, required: true },
    productColors: { type: String },
    productSizes: { type: String, enum: ["XS", "S", "M", "L", "XL"] },
    priceBeforeDiscount: String,
    finalPrice: String,
    discountPercentage: String,
    discountValue: String,
    rating: String,
    numberOfRating: String,

    category: {
      type: String,
      required: true,
    },
    subCategory: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
