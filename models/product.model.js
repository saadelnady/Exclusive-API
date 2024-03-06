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
        size: { type: String, required: true },
        color: { type: String, required: true },
        stockCount: { type: String, required: true },
        price: {
          priceBeforeDiscount: { type: String, required: true },
          discountPercentage: { type: String, required: true },
          finalPrice: { type: String, required: true },
          discountValue: { type: String, required: true },
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
