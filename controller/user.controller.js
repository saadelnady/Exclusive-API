const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const asyncWrapper = require("../middlewares/asyncWrapper");
const appError = require("../utils/appError");
const { httpStatusText, userStatus } = require("../utils/constants");
const {
  generateToken,
  generateVerificationCode,
  escapeRegex,
} = require("../utils/utils");
const { sendEmail } = require("../utils/utils");

const fs = require("fs");
const mongoose = require("mongoose");
const { getImageFullPath } = require("../utils/utils");

const userRegister = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, mobilePhone, fcmToken } = req.body;
  const locale = req?.headers?.locale;

  const existingEmail = await User.findOne({ email });
  const existingPhone = await User.findOne({ mobilePhone });

  if (existingEmail) {
    const error = appError.create(
      { ar: "المستخدم موجود بالفعل", en: "User already exists" },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  if (existingPhone) {
    const error = appError.create(
      { ar: "رقم الجوال موجود بالفعل", en: "Mobile Phone is Already Exist" },
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

  await User.create({
    name,
    email,
    password: hashedPassword,
    mobilePhone,
    verificationCode,
    verificationCodeExpires,
    status: userStatus.NOTVERIFIED,
    fcmToken,
  });
  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message:
      locale === "ar"
        ? `تم ارسال كود التحقق الى البريد الالكتروني ${email}`
        : `Verification code sent to email ${email} successfully`,
  });
});

const verifyUser = asyncWrapper(async (req, res, next) => {
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

  const user = await User.findOne({ email });

  if (!user) {
    return next(
      appError.create(
        { ar: "المستخدم غير موجود", en: "User not found" },
        404,
        httpStatusText.FAIL
      )
    );
  }

  if (user.status === userStatus.VERIFIED) {
    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: {
        ar: "الحساب مفعل بالفعل",
        en: "Account is already active",
      },
    });
  }

  if (
    user.verificationCode !== verificationCode ||
    user.verificationCodeExpires < Date.now()
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

  user.status = userStatus.VERIFIED;
  user.verificationCode = "";
  user.verificationCodeExpires = "";
  await user.save();

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

  const user = await User.findOne({ email });

  if (!user) {
    return next(
      appError.create(
        { ar: "المستخدم غير موجود", en: "User not found" },
        404,
        httpStatusText.FAIL
      )
    );
  }

  if (user.status === userStatus.VERIFIED) {
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
    email: user.email,
    subject: "Your Verification Code",
    message: `Your verification code is: ${verificationCode} Please use this code to activate your account.`,
  });

  user.verificationCode = verificationCode;
  user.verificationCodeExpires = verificationCodeExpires;
  await user.save();

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: {
      ar: "تم ارسال كود التحقق  مرة أخرى",
      en: "Verification code sent again successfully",
    },
  });
});

const userLogin = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, fcmToken } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    const error = appError.create(
      {
        ar: "المستخدم غير موجود",
        en: "User not found",
      },
      500,
      httpStatusText.FAIL
    );
    return next(error);
  }
  const matchedPassword = await bcrypt.compare(password, user.password);

  if (user && matchedPassword) {
    const token = generateToken({
      id: user._id,
      role: user.role,
    });

    user.token = token;
    user.fcmToken = fcmToken;
    await user.save();
    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: { token: user.token },
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

const forgetUserPassword = asyncWrapper(async (req, res, next) => {
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

  const user = await User.findOne({ email });
  if (!user) {
    return next(
      appError.create(
        { ar: "المستخدم غير موجود", en: "User not found" },
        404,
        httpStatusText.FAIL
      )
    );
  }

  const resetCode = generateVerificationCode();
  const resetCodeExpires = Date.now() + 10 * 60 * 1000;

  await sendEmail({
    email: user.email,
    subject: "Password Reset Code",
    message: `Your password reset code is: ${resetCode}. This code will expire in 10 minutes.`,
  });

  user.resetPasswordCode = resetCode;
  user.resetPasswordExpires = resetCodeExpires;
  await user.save();

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: {
      ar: "تم إرسال كود إعادة تعيين كلمة المرور",
      en: "Password reset code sent successfully",
    },
  });
});

const verifyUserResetCode = asyncWrapper(async (req, res, next) => {
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

  const user = await User.findOne({ email });
  if (!user) {
    return next(
      appError.create(
        { ar: "المستخدم غير موجود", en: "User not found" },
        404,
        httpStatusText.FAIL
      )
    );
  }

  if (
    user.resetPasswordCode !== resetCode ||
    user.resetPasswordExpires < Date.now()
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

const resetUserPassword = asyncWrapper(async (req, res, next) => {
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

  const user = await User.findOne({ email });
  if (!user) {
    return next(
      appError.create(
        { ar: "المستخدم غير موجود", en: "User not found" },
        404,
        httpStatusText.FAIL
      )
    );
  }

  if (
    user.resetPasswordCode !== resetCode ||
    user.resetPasswordExpires < Date.now()
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

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordCode = "";
  user.resetPasswordExpires = "";
  await user.save();

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: {
      ar: "تم تغيير كلمة المرور بنجاح",
      en: "Password changed successfully",
    },
  });
});

const getUser = asyncWrapper(async (req, res, next) => {
  const { userId } = req.params;
  const targetUser = await User.findById(userId, {
    password: 0,
    __v: 0,
    token: 0,
  });
  if (!targetUser) {
    const error = appError.create(
      {
        ar: "المستخدم غير موجود",
        en: "User not found",
      },
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }
  targetUser.image = getImageFullPath(targetUser?.image);
  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: { user: targetUser } });
});

const getAllUsers = asyncWrapper(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const text = req.query.text;
  const skip = (page - 1) * limit;

  const searchQuery = {};

  if (text) {
    const safeText = escapeRegex(text);
    const regex = { $regex: safeText, $options: "i" };

    searchQuery.$or = [
      { firstName: regex },
      { lastName: regex },
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

  const [users, totalUsersCount] = await Promise.all([
    User.find(searchQuery, { __v: 0, password: 0 }).limit(limit).skip(skip),
    User.countDocuments(searchQuery),
  ]);

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      users,
      total: totalUsersCount,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(totalUsersCount / limit),
    },
  });
});

const deleteUser = asyncWrapper(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const deletedUser = await User.findByIdAndDelete(req.params.userId);

  if (!deletedUser) {
    const error = appError.create(
      { ar: "هذا المستخدم غير موجود", en: "User not found" },
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const [users, total] = await Promise.all([
    User.find({}, { password: 0, __v: 0 }).limit(limit).skip(skip),
    User.countDocuments(),
  ]);

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    users,
    total,
    currentPage: page,
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
    message: { ar: "تم حذف المستخدم بنجاح", en: "User deleted successfully" },
  });
});

const editUser = asyncWrapper(async (req, res, next) => {
  const { userId } = req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    const error = appError.create(
      { ar: "هذا المستخدم غير موجود", en: "User not found" },
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const { email, mobilePhone, newPassword, currentPassword } = req.body;

  const existingUser = await User.findOne({
    $or: [{ email }, { mobilePhone }],
    _id: { $ne: userId },
  });

  if (existingUser) {
    const error = appError.create(
      {
        ar: "البريد الإلكتروني أو رقم الجوال موجود بالفعل",
        en: "Email or mobile phone already exists",
      },
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  if (newPassword && currentPassword) {
    const matchedPassword = await bcrypt.compare(
      currentPassword,
      targetUser.password
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

    targetUser.password = await bcrypt.hash(newPassword, 10);
  }

  if (email) targetUser.email = email;
  if (mobilePhone) targetUser.mobilePhone = mobilePhone;

  Object.assign(targetUser, req.body);

  await targetUser.save();

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { user: targetUser },
    message: {
      ar: "تم تعديل الحساب بنجاح",
      en: "Account updated successfully",
    },
  });
});

const getUserProfile = asyncWrapper(async (req, res, next) => {
  const token = req?.current?.token;
  const targetUser = await User.findOne({ token }).select("-password -token");

  if (!targetUser) {
    const error = appError.create(
      { ar: "هذا الحساب  غير موجود", en: "This account does not exist" },
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }

  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: { user: targetUser } });
});

module.exports = {
  getAllUsers,
  getUserProfile,
  userRegister,
  userLogin,
  editUser,
  deleteUser,
  verifyUser,
  resendVerificationCode,
  getUser,
  forgetUserPassword,
  verifyUserResetCode,
  resetUserPassword,
};
