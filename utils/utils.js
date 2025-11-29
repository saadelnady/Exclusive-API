const jwt = require("jsonwebtoken");
const nodeMailer = require("nodemailer");
const Notification = require("../models/notifications.model");
const calculateCartTotal = (cart) => {
  cart.totalPriceBeforeDiscount = cart.products.reduce(
    (acc, item) =>
      acc + item.option.price.priceBeforeDiscount * item.selectedCount,
    0
  );

  cart.totalDiscount = cart.products.reduce((acc, item) => {
    const discountPerItem =
      item.option.price.priceBeforeDiscount - item.option.price.finalPrice;
    const itemDiscount = discountPerItem * item.selectedCount;

    // تأكد من أن الخصم قيمة صالحة
    if (!isNaN(itemDiscount) && itemDiscount > 0) {
      return acc + itemDiscount;
    }
    return acc;
  }, 0);

  cart.totalFinalPrice =
    cart.totalPriceBeforeDiscount - (cart.totalDiscount || 0) + cart.shipping;
  if (!cart.products || cart.products.length === 0) {
    cart.shipping = 0;
    cart.totalPriceBeforeDiscount = 0;
    cart.totalDiscount = 0;
    cart.totalFinalPrice = 0;
  }
  return cart;
};

const getImageFullPath = (image) => {
  if (!image) return;
  if (image?.startsWith("http://") || image?.startsWith("https://"))
    return image;
  return `${process.env.BASE_URL}/${image}`;
};
// =======================================================
const generateToken = (payLoad) => {
  const token = jwt.sign(payLoad, process.env.jwt_secret_key, {
    expiresIn: "10d",
  });
  return token;
};

// =======================================================

const generateVerificationCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};
// =======================================================

const generateSlug = (title) => {
  return title
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF\-]/g, "")
    .toLowerCase();
};

// =======================================================

const sendEmail = async (options) => {
  // User who sends the email
  const transporter = nodeMailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    // TLS configuration
    secure: true, // Use TLS
    tls: {
      // Reject unauthorized connections
      rejectUnauthorized: false, // Set to true in production with valid certificates
    },
  });

  // User who receives the email
  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // Send email
  await transporter.sendMail(mailOptions);
};
// =======================================================

const createNotification = async ({
  title,
  description,
  recipientRole,
  recipientId,
}) => {
  try {
    if (!title || !description || !recipientRole) {
      throw new Error("Missing required fields for notification");
    }

    await Notification.create({
      title,
      description,
      recipientRole,
      recipientId,
    });
  } catch (error) {
    console.error("Error creating notification:", error.description);
  }
};
// =======================================================
const admin = require("../config/firebase-admin");

const sendPushNotification = async (token, title, body) => {
  if (!token) return;

  const message = {
    notification: { title, body },
    token,
  };

  try {
    const response = await admin.messaging().send(message); // استخدم send وليس sendMulticast
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

// =======================================================

const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = {
  calculateCartTotal,
  getImageFullPath,
  generateToken,
  sendEmail,
  generateVerificationCode,
  generateSlug,
  createNotification,
  sendPushNotification,
  escapeRegex,
};
