const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

const asyncWrapper = require("../middlewares/asyncWrapper");
const Seller = require("../models/seller.model");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/utils");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");
const productStatus = require("../utils/productStatus");

const sellerRegister = asyncWrapper(async (req, res, next) => {
  const { firstName, lastName, email, mobilePhone, password } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const emailExist = await Seller.findOne({ email: email });
  const mobilePhoneExist = await Seller.findOne({ mobilePhone: mobilePhone });

  if (emailExist) {
    const error = appError.create(
      "user already exists",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  if (mobilePhoneExist) {
    const error = appError.create(
      "Mobile Phone is Already Exist",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newSeller = new Seller({
    firstName,
    lastName,
    email,
    mobilePhone,
    password: hashedPassword,
  });

  const token = generateToken({
    id: newSeller._id,
    role: newSeller.role,
  });

  newSeller.token = token;

  await newSeller.save();

  const activationUrl = `${process.env.BAIS_URL}/activation/${newSeller.token}`;

  await sendEmail({
    email: newSeller.email,
    subject: "Activate your account",
    message: `Hello ${newSeller.firstName} , please click on the link to activate your account ${activationUrl}`,
  });

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: { token: newSeller.token },
    message: `please cheack your email:-${newSeller.email} to activate your account`,
  });
});

const sellerLogin = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  const { email, password } = req.body;

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const targetSeller = await Seller.findOne({ email });

  if (!targetSeller) {
    const error = appError.create("email not found", 500, httpStatusText.FAIL);
    return next(error);
  }
  const matchedPassword = await bcrypt.compare(password, targetSeller.password);

  if (targetSeller && matchedPassword) {
    const token = generateToken({
      id: targetSeller._id,
      role: targetSeller.role,
    });
    targetSeller.token = token;
    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: { token: targetSeller.token },
      message: "logged in successfully",
    });
  } else {
    const error = appError.create(
      "something wrong email or password is not correct",
      400,
      httpStatusText.ERROR
    );
    return next(error);
  }
});

const getSeller = asyncWrapper(async (req, res, next) => {
  const { sellerId } = req.params;
  const targetSeller = await Seller.findById(sellerId, {
    password: false,
  });

  if (!targetSeller) {
    const error = appError.create(
      "seller not found",
      400,
      httpStatusText.ERROR
    );
    return next(error);
  }

  res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: { seller: targetSeller } });
});

const getSellerProducts = asyncWrapper(async (req, res, next) => {
  const { sellerId, status } = req.query;

  // Convert status string to array if it's provided in the query
  const targetStatus = [
    productRoles.ACCEPTED,
    productRoles.BLOCKED,
    productRoles.PENDING,
  ].includes(status);

  // Find the target seller and filter products by status
  if (targetStatus) {
    const targetSeller = await Seller.findById(sellerId, {
      password: false,
    }).populate({
      path: "products",
      match: { status: { $in: targetStatus } }, // Filter products by status
    });
  }

  if (!targetSeller) {
    const error = appError.create(
      "Seller not found",
      404,
      httpStatusText.NOT_FOUND
    );
    return next(error);
  }

  const targetSellerProducts = targetSeller.products;
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { products: targetSellerProducts },
  });
});

const getAllSellers = asyncWrapper(async (req, res, next) => {
  const query = req.query;

  const limit = query.limit;
  const page = query.page;
  const skip = (page - 1) * limit;
  let sellers = await Seller.find({}, { __v: false, password: false })
    .limit(limit)
    .skip(skip);
  if (!sellers) {
    const error = appError.create(
      "sellers not found",
      400,
      httpStatusText.ERROR
    );
    return next(error);
  }

  res.status(200).json({ status: httpStatusText.SUCCESS, data: { sellers } });
});

const deleteSeller = asyncWrapper(async (req, res, next) => {
  const sellerId = req.params.id;
  const targetSeller = await Seller.findById(sellerId);
  if (!targetSeller) {
    const error = appError.create("Seller not found", 404, httpStatusText.FAIL);
    return next(error);
  }

  const options = { new: true };

  const deletedSeller = await Seller.findByIdAndDelete(sellerId);

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { seller: deletedSeller },
    message: "Account deleted successfully",
  });
});

const editSeller = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const sellerId = req.params.id;
  const targetSeller = await Seller.findById(sellerId);
  if (!targetSeller) {
    const error = appError.create("Seller not found", 404, httpStatusText.FAIL);
    return next(error);
  }

  const options = { new: true };

  const updatedSeller = await Seller.findByIdAndUpdate(
    sellerId,
    { $set: { ...req.body } },
    options
  );

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { seller: updatedSeller },
    message: "Account updated successfully",
  });
});

const getSellerProfile = asyncWrapper(async (req, res, next) => {
  const sellerId = req.current.id;
  const targetSeller = await Seller.findById(sellerId, {
    password: false,
  });

  if (!targetSeller) {
    const error = appError.create(
      "seller not found",
      400,
      httpStatusText.ERROR
    );
    return next(error);
  }

  res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: { seller: targetSeller } });
});

module.exports = {
  sellerRegister,
  sellerLogin,
  getSeller,
  editSeller,
  getAllSellers,
  deleteSeller,
  getSellerProfile,
};
