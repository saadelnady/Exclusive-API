const mongoose = require("mongoose");
const validator = require("validator");
const { sellerStatus, roles } = require("../utils/constants");

const sellerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    image: { type: String, default: "uploads/user-default.png" },
    mobilePhone: { type: String, unique: true, required: true },
    address: { type: String },
    email: {
      type: String,
      validator: [validator.isEmail, "Email must be valid email"],
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(sellerStatus),
      default: sellerStatus.NOTVERIFIED,
    },
    blockReason: {
      type: String,
      default: null,
      validate: {
        validator: function (value) {
          if (value && this.status !== sellerStatus.BLOCKED) {
            return false;
          }
          return true;
        },
        message: "blockReason can only be set when status is BLOCKED",
      },
    },
    dateOfBirth: { type: Date },
    token: { type: String },
    verificationCode: {
      type: String,
    },

    verificationCodeExpires: {
      type: Date,
    },

    resetPasswordCode: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },

    products: [{ type: mongoose.Types.ObjectId, ref: "Product" }],
    role: { type: String, default: roles.SELLER },
    nationalId: { type: String },
    officialDocuments: {
      frontId: { type: String },
      backId: { type: String },
      taxCard: { type: String },
      commercialRegister: { type: String },
      otherDocs: { type: String },
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },

    storeName: { type: String },

    paymentInfo: {
      method: {
        type: String,
        enum: ["card", "instapay", "vodafoneCash"],
      },
      card: {
        cardHolderName: { type: String },
        cardLast4Digits: { type: String },
        cardBrand: {
          type: String,
          enum: ["Visa", "MasterCard", "Discover"],
        },
        expiryDate: { type: String },
      },
      instapay: {
        phone: { type: String },
      },
      vodafoneCash: {
        phone: { type: String },
      },
    },
    fcmToken: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Seller", sellerSchema);
