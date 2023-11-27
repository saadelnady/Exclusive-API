const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  productImage: {
    type: String,
    default: "uploads/products/product-default.png",
  },
  productDescription: { type: String, required: true },
  productColor: { type: String },
  productSize: { type: String, enum: ["XS", "S", "M", "L", "XL"] },
  priceBeforeDiscount: String,
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
});

module.exports = mongoose.model("Product", productSchema);
