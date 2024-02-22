const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    images: { type: [String] },
    category: { type: mongoose.Types.ObjectId, ref: "Category" },
    subCategory: { type: mongoose.Types.ObjectId, ref: "Subcategory" },
    productOwner: { type: mongoose.Types.ObjectId, ref: "Seller" },
    options: [
      {
        size: { type: String },
        color: { type: String },
        stockCount: { type: String },
        price: {
          priceBeforeDiscount: { type: String },
          discountPercentage: { type: String },
          finalPrice: { type: String },
          discountValue: { type: String },
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
