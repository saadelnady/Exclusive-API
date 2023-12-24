const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

const asyncWrapper = require("../middlewares/asyncWrapper");
const Seller = require("../models/seller.model");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/utils");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");

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

  const token = generateToken({ id: newSeller._id });

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
    data: { seller: newSeller },
    message: `please cheack your email:-${newSeller.email} to activate your account`,
  });
});

const loginSeller = asyncWrapper(async (req, res, next) => {
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
    const token = generateToken({ id: targetSeller._id });
    targetSeller.token = token;
    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: { seller: targetSeller },
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

module.exports = { sellerRegister, loginSeller };
