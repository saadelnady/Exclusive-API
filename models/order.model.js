const mongoose = require("mongoose");
const {
  orderStatus,
  paymentStatus,
  paymentMethods,
} = require("../utils/constants");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(orderStatus),
      default: orderStatus.PENDING,
    },

    payment: {
      method: {
        type: String,
        enum: Object.values(paymentMethods),
        default: paymentMethods.CASH,
      },
      status: {
        type: String,
        enum: Object.values(paymentStatus),
        default: paymentStatus.PENDING,
      },
      transactionId: {
        type: String,
      },
    },

    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      city: { type: String, required: true },
      country: { type: String, required: true, default: "Egypt" },
      postalCode: { type: String },
      description: { type: String },
      location: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },

    deliveryDate: { type: Date },
    canceledAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
