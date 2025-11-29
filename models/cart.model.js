const mongoose = require("mongoose");

const attributeSchema = new mongoose.Schema(
  {
    title: {
      ar: { type: String },
      en: { type: String },
    },
    value: mongoose.Schema.Types.Mixed,
    type: { type: String },
  },
  { _id: true }
);

const optionSchema = new mongoose.Schema({
  optionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  images: [String],
  attributes: [attributeSchema],
  stockCount: Number,
  price: {
    priceBeforeDiscount: Number,
    discountPercentage: Number,
    discountValue: Number,
    finalPrice: Number,
  },
});

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  option: {
    type: optionSchema,
    required: true,
  },
  selectedCount: { type: Number, required: true, min: 1 },
  subTotal: { type: Number, required: true, min: 0 },
});

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    products: [cartItemSchema],
    totalPriceBeforeDiscount: { type: Number, default: 0 },
    totalFinalPrice: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    paymentMethod: { type: String },
    shipping: { type: Number, default: 50 },
    coupon: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
