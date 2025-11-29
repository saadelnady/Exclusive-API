const mongoose = require("mongoose");

const flashSaleSchema = new mongoose.Schema(
  {
    title: {
      ar: { type: String, required: true },
      en: { type: String, required: true },
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        optionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Option",
          default: null,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FlashSale", flashSaleSchema);

async function deactivateExpiredFlashSales() {
  await mongoose
    .model("FlashSale")
    .updateMany(
      { endDate: { $lt: new Date() }, isActive: true },
      { $set: { isActive: false } }
    );
}

flashSaleSchema.pre(/^find/, async function (next) {
  await deactivateExpiredFlashSales();
  next();
});
