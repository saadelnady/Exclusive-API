const mongoose = require("mongoose");
const { roles } = require("../utils/constants");

const notificationSchema = new mongoose.Schema({
  title: {
    ar: { type: String },
    en: { type: String },
  },
  description: {
    ar: { type: String },
    en: { type: String },
  },
  recipientRole: {
    type: String,
    enum: [roles.ADMIN, roles.SUPER_ADMIN, roles.USER, roles.SELLER],
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
