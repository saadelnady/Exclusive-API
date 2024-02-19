const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    images: { type: [String], default: [] },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Subcategory" },
    productOwner: { type: mongoose.Schema.Types.ObjectId, ref: "Seller" },
    options: [
      {
        size: { type: String },
        color: { type: String, default: "#000000" },
        stockCount: { type: Number, default: 0 },
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
