const mongoose = require("mongoose");
const { productStatus } = require("../utils/constants");

const priceSchema = new mongoose.Schema({
  priceBeforeDiscount: { type: Number, required: true, min: 0 },
  discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
  discountValue: { type: Number, default: 0, min: 0 },
  finalPrice: { type: Number, required: true, min: 0 },
});

const attributeSchema = new mongoose.Schema({
  title: {
    ar: { type: String, required: true },
    en: { type: String, required: true },
  },
  value: mongoose.Schema.Types.Mixed,
  type: { type: String, required: true },
});

const offerContentSchema = new mongoose.Schema({
  title: {
    ar: { type: String, required: true },
    en: { type: String, required: true },
  },
  subtitle: {
    ar: { type: String, required: true },
    en: { type: String, required: true },
  },
  cta: {
    ar: { type: String, required: true },
    en: { type: String, required: true },
  },
  banner: { type: String, default: "" },
});
const optionSchema = new mongoose.Schema({
  images: [String],

  attributes: {
    type: [attributeSchema],
  },
  stockCount: {
    type: Number,
    required: true,
    min: [0, "Stock cannot be negative"],
  },
  price: priceSchema,
  isOffer: { type: Boolean, default: false },
  offerContent: {
    type: offerContentSchema,
    required: function () {
      return this.isOffer === true;
    },
  },
  isFlashSale: { type: Boolean, default: false },
  flashSaleId: {
    type: mongoose.Types.ObjectId,
    ref: "FlashSale",
    required: function () {
      return this.isFlashSale === true;
    },
  },
  soldOut: { type: Number, default: 0 },
});

const productSchema = new mongoose.Schema(
  {
    title: {
      ar: { type: String, required: true },
      en: { type: String, required: true },
    },
    description: {
      ar: { type: String, required: true },
      en: { type: String, required: true },
    },
    categoryId: {
      type: mongoose.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subCategoryId: { type: mongoose.Types.ObjectId, ref: "Subcategory" },
    sellerId: { type: mongoose.Types.ObjectId, ref: "Seller" },
    brandId: { type: mongoose.Types.ObjectId, ref: "Brand", required: true },
    options: [optionSchema],

    status: {
      type: String,
      enum: [
        productStatus.ACCEPTED,
        productStatus.BLOCKED,
        productStatus.PENDING,
      ],
      default: productStatus.PENDING,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
