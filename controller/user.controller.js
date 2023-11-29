const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

const User = require("../models/user.model");
const asyncWrapper = require("../middlewares/asyncWrapper");
const appError = require("../utils/appError");
const { configureMulter, fileFilter } = require("../utils/multer");
const httpStatusText = require("../utils/utils");
const generateToken = require("../utils/generateToken");
const multer = require("multer");

const upload = multer({ storage: configureMulter("users"), fileFilter });

const getAllUsers = asyncWrapper(async (req, res, next) => {
  const users = await User.find({}, { __v: false, password: false });
  if (!users) {
    const error = appError.create(
      "there is n't any user to show",
      404,
      httpStatusText.FAIL
    );
    next(error);
  }
  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: { users } });
});

const getUser = asyncWrapper(async (req, res, next) => {
  const { userId } = req.params;
  console.log(" userId ===> ", userId);
  const targetUser = await User.findById(userId);
  if (!targetUser) {
    const error = appError.create("user not found", 404, httpStatusText.FAIL);
    return next(error);
  }

  console.log("targetUser =====>", targetUser);

  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: { user: targetUser } });
});

const register = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { firstName, lastName, email, password, role, mobile } = req.body;
  const oldUser = await User.findOne({ email: email });
  if (oldUser) {
    const error = appError.create(
      "user already exists",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  //genereate token
  const token = await generateToken({ firstName, lastName, email, role });

  const newUser = new User({
    firstName,
    lastName,
    email,
    mobile,
    password: hashedPassword,
    role,
  });
  newUser.token = token;
  await newUser.save();
  res
    .status(201)
    .json({ status: httpStatusText.SUCCESS, data: { user: newUser } });
});

const login = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email: email });

  const matchedPassword = await bcrypt.compare(password, user.password);

  if (!user) {
    const error = appError.create("email not found", 500, httpStatusText.FAIL);
    return next(error);
  }

  if (user && matchedPassword) {
    const token = await generateToken({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
    user.token = token;
    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: { user: user },
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

module.exports = { getAllUsers, getUser, register, login };
