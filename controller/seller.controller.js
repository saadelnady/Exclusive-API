const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

const asyncWrapper = require("../middlewares/asyncWrapper");
const Seller = require("../models/seller.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const appError = require("../utils/appError");
const {
  generateToken,
  generateVerificationCode,
  getImageFullPath,
  escapeRegex,
} = require("../utils/utils");
const { sendEmail } = require("../utils/utils");
const {
  productStatus,
  httpStatusText,
  sellerStatus,
  roles,
} = require("../utils/constants");
const Notification = require("../models/notifications.model");

const moment = require("moment");
require("moment/locale/ar");

const mongoose = require("mongoose");

const sellerRegister = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { name, email, mobilePhone, password, fcmToken } = req.body;

  const emailExist = await Seller.findOne({ email: email });
  const mobilePhoneExist = await Seller.findOne({ mobilePhone: mobilePhone });

  if (emailExist) {
    const error = appError.create(
      {
        ar: "البريد الالكتروني موجود بالفعل",
        en: "Email is Already Exist",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  if (mobilePhoneExist) {
    const error = appError.create(
      {
        ar: "رقم الهاتف موجود بالفعل",
        en: "Mobile Phone is Already Exist",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const verificationCode = generateVerificationCode();
  const verificationCodeExpires = Date.now() + 10 * 60 * 1000;

  const hashedPassword = await bcrypt.hash(password, 10);

  await sendEmail({
    email,
    subject: "Your Verification Code",
    message: `Your verification code is: ${verificationCode} Please use this code to activate your account.`,
  });

  await Seller.create({
    name,
    email,
    password: hashedPassword,
    mobilePhone,
    verificationCode,
    verificationCodeExpires,
    status: sellerStatus.NOTVERIFIED,
    fcmToken,
  });

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: {
      ar: `تم تسجيل الحساب بنجاح. برجاء التحقق من بريدك الإلكتروني ${email} لتفعيل الحساب.`,
      en: `Your account has been successfully registered. Please check your email ${email} to activate your account.`,
    },
  });
});

const verifySeller = asyncWrapper(async (req, res, next) => {
  const { email, verificationCode } = req.body;

  if (!email || !verificationCode) {
    return next(
      appError.create(
        {
          ar: "يجب إدخال البريد الإلكتروني وكود التحقق",
          en: "Email and verification code are required",
        },
        400,
        httpStatusText.FAIL
      )
    );
  }

  const seller = await Seller.findOne({ email });

  if (!seller) {
    return next(
      appError.create(
        { ar: "البريد الالكترونى غير موجود", en: "Email not found" },
        404,
        httpStatusText.FAIL
      )
    );
  }

  if (seller.status === sellerStatus.VERIFIED) {
    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: {
        ar: "الحساب مفعل بالفعل",
        en: "Account is already active",
      },
    });
  }

  if (
    seller.verificationCode !== verificationCode ||
    seller.verificationCodeExpires < Date.now()
  ) {
    return next(
      appError.create(
        {
          ar: "كود التحقق غير صالح أو منتهي الصلاحية",
          en: "Invalid or expired verification code",
        },
        400,
        httpStatusText.FAIL
      )
    );
  }

  seller.status = sellerStatus.VERIFIED;
  seller.verificationCode = "";
  seller.verificationCodeExpires = "";
  await seller.save();

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: {
      ar: "تم التحقق من الحساب بنجاح",
      en: "Account verified successfully",
    },
  });
});

const resendVerificationCode = asyncWrapper(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(
      appError.create(
        { ar: "يرجى إدخال البريد الإلكتروني", en: "Email is required" },
        400,
        httpStatusText.FAIL
      )
    );
  }

  const seller = await Seller.findOne({ email });

  if (!seller) {
    return next(
      appError.create(
        { ar: "البائع غير موجود", en: "Seller not found" },
        404,
        httpStatusText.FAIL
      )
    );
  }

  if (seller.status === sellerStatus.VERIFIED) {
    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: {
        ar: "الحساب مفعل بالفعل",
        en: "Account is already verified",
      },
    });
  }

  const verificationCode = generateVerificationCode();
  const verificationCodeExpires = Date.now() + 10 * 60 * 1000;

  await sendEmail({
    email: seller.email,
    subject: "Your Verification Code",
    message: `Your verification code is: ${verificationCode} Please use this code to activate your account.`,
  });

  seller.verificationCode = verificationCode;
  seller.verificationCodeExpires = verificationCodeExpires;
  await seller.save();

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: {
      ar: "تم ارسال كود التحقق  مرة أخرى",
      en: "Verification code sent again successfully",
    },
  });
});

const forgetSellerPassword = asyncWrapper(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(
      appError.create(
        { ar: "يرجى إدخال البريد الإلكتروني", en: "Email is required" },
        400,
        httpStatusText.FAIL
      )
    );
  }

  const seller = await Seller.findOne({ email });
  if (!seller) {
    return next(
      appError.create(
        { ar: "البائع غير موجود", en: "Seller not found" },
        404,
        httpStatusText.FAIL
      )
    );
  }

  const resetCode = generateVerificationCode();
  const resetCodeExpires = Date.now() + 10 * 60 * 1000;

  await sendEmail({
    email: seller.email,
    subject: "Password Reset Code",
    message: `Your password reset code is: ${resetCode}. This code will expire in 10 minutes.`,
  });

  seller.resetPasswordCode = resetCode;
  seller.resetPasswordExpires = resetCodeExpires;
  await seller.save();

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: {
      ar: "تم إرسال كود إعادة تعيين كلمة المرور",
      en: "Password reset code sent successfully",
    },
  });
});

const verifyResetCode = asyncWrapper(async (req, res, next) => {
  const { email, resetCode } = req.body;

  if (!email || !resetCode) {
    return next(
      appError.create(
        {
          ar: "يجب إدخال البريد الإلكتروني والكود",
          en: "Email and reset code are required",
        },
        400,
        httpStatusText.FAIL
      )
    );
  }

  const seller = await Seller.findOne({ email });
  if (!seller) {
    return next(
      appError.create(
        { ar: "البائع غير موجود", en: "Seller not found" },
        404,
        httpStatusText.FAIL
      )
    );
  }

  if (
    seller.resetPasswordCode !== resetCode ||
    seller.resetPasswordExpires < Date.now()
  ) {
    return next(
      appError.create(
        {
          ar: "الكود غير صالح أو منتهي الصلاحية",
          en: "Invalid or expired reset code",
        },
        400,
        httpStatusText.FAIL
      )
    );
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: {
      ar: "تم التحقق من الكود بنجاح",
      en: "Reset code verified successfully",
    },
  });
});

const resetSellerPassword = asyncWrapper(async (req, res, next) => {
  const { email, resetCode, newPassword } = req.body;

  if (!email || !resetCode || !newPassword) {
    return next(
      appError.create(
        {
          ar: "يجب إدخال البريد الإلكتروني، الكود، وكلمة المرور الجديدة",
          en: "Email, reset code, and new password are required",
        },
        400,
        httpStatusText.FAIL
      )
    );
  }

  const seller = await Seller.findOne({ email });
  if (!seller) {
    return next(
      appError.create(
        { ar: "البائع غير موجود", en: "Seller not found" },
        404,
        httpStatusText.FAIL
      )
    );
  }

  if (
    seller.resetPasswordCode !== resetCode ||
    seller.resetPasswordExpires < Date.now()
  ) {
    return next(
      appError.create(
        {
          ar: "الكود غير صالح أو منتهي الصلاحية",
          en: "Invalid or expired reset code",
        },
        400,
        httpStatusText.FAIL
      )
    );
  }

  seller.password = await bcrypt.hash(newPassword, 10);
  seller.resetPasswordCode = "";
  seller.resetPasswordExpires = "";
  await seller.save();

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: {
      ar: "تم تغيير كلمة المرور بنجاح",
      en: "Password changed successfully",
    },
  });
});

const sellerLogin = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  const { email, password, fcmToken } = req.body;

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const targetSeller = await Seller.findOne({ email });

  if (!targetSeller) {
    const error = appError.create(
      {
        ar: "البائع غير موجود",
        en: "seller not found",
      },
      500,
      httpStatusText.FAIL
    );
    return next(error);
  }
  const matchedPassword = await bcrypt.compare(password, targetSeller.password);

  if (targetSeller && matchedPassword) {
    const token = generateToken({
      id: targetSeller._id,
      role: roles.SELLER,
    });
    targetSeller.token = token;
    targetSeller.fcmToken = fcmToken;
    await targetSeller.save();
    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: { token: targetSeller.token },
      message: {
        ar: "تم تسجيل الدخول بنجاح",
        en: "Login successfully",
      },
    });
  } else {
    const error = appError.create(
      {
        ar: " البريد الالكترونى أو كلمة المرور غير صحيحة",
        en: "Invalid email or password",
      },
      400,
      httpStatusText.ERROR
    );
    return next(error);
  }
});

const getSeller = asyncWrapper(async (req, res, next) => {
  const { sellerId } = req.params;

  const targetSeller = await Seller.findById(sellerId, {
    password: 0,
    __v: 0,
  }).populate("products", "-__v");

  if (!targetSeller) {
    const error = appError.create(
      {
        ar: "البائع غير موجود",
        en: "seller not found",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  targetSeller.image = getImageFullPath(targetSeller?.image);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { seller: targetSeller },
  });
});

const getSellerProducts = asyncWrapper(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  const { sellerId, status, text } = req.query;

  const validStatuses = [
    productStatus.ACCEPTED,
    productStatus.BLOCKED,
    productStatus.PENDING,
  ];

  if (status && !validStatuses.includes(status)) {
    const error = appError.create(
      {
        ar: "حالة المنتج غير صحيحة",
        en: "Invalid product status",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const sellerExists = await Seller.findById(sellerId);
  if (!sellerExists) {
    const error = appError.create(
      {
        ar: "البائع غير موجود",
        en: "Seller not found",
      },
      404,
      NOT_FOUND
    );
    return next(error);
  }

  const searchQuery = { seller: sellerId };

  if (status) {
    searchQuery.status = status;
  }

  if (text) {
    const safeText = escapeRegex(text);
    const regex = { $regex: safeText, $options: "i" };

    searchQuery.$or = [
      { "title.ar": regex },
      { "title.en": regex },
      {
        _id: mongoose.Types.ObjectId.isValid(text)
          ? new mongoose.Types.ObjectId(text)
          : undefined,
      },
    ].filter(Boolean);
  }

  const [products, total] = await Promise.all([
    Product.find(searchQuery, { __v: 0 }).limit(limit).skip(skip),
    Product.countDocuments(searchQuery),
  ]);

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      products,
      total,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

const getAllSellers = asyncWrapper(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const text = req.query.text;
  const status = req.query.status;
  const skip = (page - 1) * limit;

  const searchQuery = {};

  if (text) {
    const safeText = escapeRegex(text);
    const regex = { $regex: safeText, $options: "i" };

    searchQuery.$or = [
      { name: regex },
      { email: regex },
      { mobilePhone: regex },
      { address: regex },
      {
        _id: mongoose.Types.ObjectId.isValid(text)
          ? new mongoose.Types.ObjectId(text)
          : undefined,
      },
    ].filter(Boolean);
  }

  if (status) {
    if (Array.isArray(status)) {
      searchQuery.status = { $in: status };
    } else {
      searchQuery.status = status;
    }
  }

  const [sellers, totalSellersCount] = await Promise.all([
    Seller.find(searchQuery, { __v: 0, password: 0 }).limit(limit).skip(skip),
    Seller.countDocuments(searchQuery),
  ]);

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      sellers,
      total: totalSellersCount,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(totalSellersCount / limit),
    },
  });
});

const deleteSeller = asyncWrapper(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const deletedSeller = await Seller.findByIdAndDelete(req.params.sellerId);

  if (!deletedSeller) {
    const error = appError.create(
      { ar: "هذا الحساب غير موجود", en: "This account does not exist" },
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const [sellers, total] = await Promise.all([
    Seller.find({}, { password: 0, __v: 0 }).limit(limit).skip(skip),
    Seller.countDocuments(),
  ]);

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    sellers,
    total,
    currentPage: page,
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
    message: { ar: "تم حذف الحساب بنجاح", en: "Account deleted successfully" },
  });
});

const editSeller = asyncWrapper(async (req, res, next) => {
  const { sellerId } = req.params;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const targetSeller = await Seller.findById(sellerId);
  if (!targetSeller) {
    const error = appError.create(
      { ar: "هذا الحساب غير موجود", en: "This account does not exist" },
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const { email, mobilePhone, newPassword, currentPassword } = req.body;

  const existingSeller = await Seller.findOne({
    $or: [{ email }, { mobilePhone }],
    _id: { $ne: sellerId },
  });

  if (existingSeller) {
    const error = appError.create(
      {
        ar: "البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل",
        en: "Email or mobile phone already exists",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const updateFields = { ...req.body };
  delete updateFields.newPassword;
  delete updateFields.currentPassword;

  const { paymentInfo } = updateFields;

  if (paymentInfo) {
    const { method } = paymentInfo;

    if (!["card", "instapay", "vodafoneCash"].includes(method)) {
      const error = appError.create(
        {
          ar: "نوع وسيلة الدفع غير مدعوم",
          en: "Invalid payment method",
        },
        400,
        httpStatusText.FAIL
      );
      return next(error);
    }

    if (method === "card") {
      const card = paymentInfo.card || {};
      if (
        !card.cardHolderName ||
        !card.cardLast4Digits ||
        !card.cardBrand ||
        !card.expiryDate
      ) {
        const error = appError.create(
          {
            ar: "برجاء ملء جميع بيانات البطاقة",
            en: "Please fill in all card details",
          },
          400,
          httpStatusText.FAIL
        );
        return next(error);
      }
    }

    if (method === "instapay") {
      const instapay = paymentInfo.instapay || {};
      if (!instapay.phone) {
        const error = appError.create(
          {
            ar: " برجاء إدخال رقم Instapay ",
            en: "Please provide a valid Instapay  phone number",
          },
          400,
          httpStatusText.FAIL
        );
        return next(error);
      }
    }

    if (method === "vodafoneCash") {
      const vfCash = paymentInfo.vodafoneCash || {};
      if (!vfCash.phone) {
        const error = appError.create(
          {
            ar: "برجاء إدخال رقم فودافون كاش",
            en: "Please provide Vodafone Cash phone number",
          },
          400,
          httpStatusText.FAIL
        );
        return next(error);
      }
    }
  }

  const docs = updateFields.officialDocuments;
  if (docs) {
    const { frontId, backId, commercialRegister, taxCard, otherDocs } = docs;

    const hasAllDocs =
      frontId && backId && commercialRegister && taxCard && otherDocs;

    if (hasAllDocs) {
      updateFields.status = sellerStatus.PENDING_APPROVAL;
      updateFields.isProfileComplete = true;
    }
  }
  if (
    updateFields?.status === sellerStatus.VERIFIED &&
    targetSeller.isProfileComplete
  ) {
    await sendEmail({
      email: targetSeller.email,
      subject: "Account Verification Successful",
      message: `Your account has been successfully verified. You can now start selling products.`,
    });
  }
  const updatedSeller = await Seller.findByIdAndUpdate(
    sellerId,
    { $set: updateFields },
    { new: true }
  );

  if (newPassword) {
    if (!currentPassword) {
      const error = appError.create(
        {
          ar: "برجاء إدخال كلمة المرور الحالية",
          en: "Please enter your current password",
        },
        400,
        httpStatusText.FAIL
      );
      return next(error);
    }

    const matchedPassword = await bcrypt.compare(
      currentPassword,
      targetSeller.password
    );

    if (!matchedPassword) {
      const error = appError.create(
        {
          ar: "كلمة المرور الحالية غير صحيحة",
          en: "Current password is incorrect",
        },
        400,
        httpStatusText.FAIL
      );
      return next(error);
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    updatedSeller.password = hashedNewPassword;
    await updatedSeller.save();
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { seller: updatedSeller },
    message: {
      ar: "تم تعديل الحساب بنجاح",
      en: "Profile updated successfully",
    },
  });
});

const getSellerProfile = asyncWrapper(async (req, res, next) => {
  const token = req?.current?.token;

  const targetSeller = await Seller.findOne({ token }).select(
    "-password -token"
  );

  if (!targetSeller) {
    const error = appError.create(
      { ar: "هذا الحساب  غير موجود", en: "This account does not exist" },
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }

  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: { seller: targetSeller } });
});

const getSellerStatistics = asyncWrapper(async (req, res, next) => {
  const { sellerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    return next(
      appError.create(
        { ar: "معرّف البائع غير صالح", en: "Invalid seller ID" },
        400,
        httpStatusText.FAIL
      )
    );
  }

  const [seller, products, orders] = await Promise.all([
    Seller.findById(sellerId, { __v: 0 }),
    Product.find({ sellerId }, { __v: 0 }),
    Order.find({ "items.seller": sellerId }, { __v: 0 }),
  ]);

  if (!seller) {
    return next(
      appError.create(
        { ar: "البائع غير موجود", en: "Seller not found" },
        404,
        httpStatusText.FAIL
      )
    );
  }

  const now = moment();
  const salesData = [];

  for (let i = 5; i >= 0; i--) {
    const start = moment(now).subtract(i, "months").startOf("month").toDate();
    const end = moment(now).subtract(i, "months").endOf("month").toDate();

    const monthlySales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          "items.seller": new mongoose.Types.ObjectId(sellerId),
        },
      },
      {
        $unwind: "$items",
      },
      {
        $match: {
          "items.seller": new mongoose.Types.ObjectId(sellerId),
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$items.totalPrice" },
        },
      },
    ]);

    const monthEn = moment(start).locale("en").format("MMMM");
    const monthAr = moment(start).locale("ar").format("MMMM");

    salesData.push({
      name: { ar: monthAr, en: monthEn },
      sales: monthlySales[0]?.total || 0,
    });
  }

  const statistics = {
    statisticsData: [
      {
        title: { ar: "المنتجات", en: "Products" },
        total: products.length,
      },
      {
        title: { ar: "الطلبات", en: "Orders" },
        total: orders.length,
      },
    ],
    salesData: {
      title: {
        ar: "مبيعات آخر 6 أشهر",
        en: "Sales of the last 6 months",
      },
      data: salesData,
    },
  };

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { statistics },
  });
});

const getSellerNotifications = asyncWrapper(async (req, res, next) => {
  const { sellerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    return next(
      appError.create(
        { ar: "معرّف البائع غير صالح", en: "Invalid seller ID" },
        400,
        httpStatusText.FAIL
      )
    );
  }

  const notifications = await Notification.find({
    recipientRole: roles.SELLER,
    recipientId: sellerId,
  }).sort({ createdAt: -1 });

  if (!notifications || notifications.length === 0) {
    return next(
      appError.create(
        { ar: "لا يوجد إشعارات", en: "No notifications found" },
        404,
        httpStatusText.FAIL
      )
    );
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { notifications },
  });
});

module.exports = {
  sellerRegister,
  sellerLogin,
  getSeller,
  editSeller,
  getAllSellers,
  deleteSeller,
  getSellerProfile,
  getSellerProducts,
  resendVerificationCode,
  verifySeller,
  getSellerStatistics,
  getSellerNotifications,
  forgetSellerPassword,
  resetSellerPassword,
  verifyResetCode,
};
