const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true },
    size: { type: String, required: true }, // Added size for cart items
    color: { type: String, required: true }, // Added color for cart items
  },
  { _id: false } // Disable _id for subdocuments since each cart item doesn't need a unique identifier
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    items: [cartItemSchema], // Use an array to store cart items directly in the cart schema
    totalItems: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
  },
  { timestamps: true }
);
// Virtual property to calculate and update total items and total price
cartSchema.virtual("updateTotals").set(function () {
  this.totalItems = this.items.reduce(
    (total, item) => total + item.quantity,
    0
  );
  this.totalPrice = this.items.reduce(
    (total, item) => total + item.totalPrice,
    0
  );
});

// Pre-save hook to update totals before saving
cartSchema.pre("save", function (next) {
  this.updateTotals = undefined; // Clear the updateTotals virtual property
  next();
});

module.exports = mongoose.model("Cart", cartSchema);
