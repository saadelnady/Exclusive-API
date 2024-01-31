const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const asyncWrapper = require("../middlewares/asyncWrapper");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/utils");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");

const getAllUsers = asyncWrapper(async (req, res, next) => {
  const query = req.query;

  const limit = query.limit;
  const page = query.page;
  const skip = (page - 1) * limit;
  const users = await User.find({}, { __v: false, password: false })
    .limit(limit)
    .skip(skip);
  if (!users) {
    const error = appError.create(
      "there is n't any user to show",
      404,
      httpStatusText.FAIL
    );
    next(error);
  }
  users.map((user) => {
    return (user.userImage = `${process.env.BAIS_URL}/${user.userImage}`);
  });
  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: { users } });
});

const updateUser = asyncWrapper(async (req, res, next) => {
  const { userId } = req.params;
  const targetUser = await User.findById(userId);
  if (!targetUser) {
    const error = appError.create("user not found", 400, httpStatusText.FAIL);
    return next(error);
  }
  const options = {
    new: true,
  };

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: { ...req.body },
    },
    options
  );

  updatedUser.userImage = req.file.filename;

  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: { user: updatedUser } });
});

const getUserProfile = asyncWrapper(async (req, res, next) => {
  const currentId = req.currentUser.id;
  const targetUser = await User.findById(currentId, { password: false });
  if (!targetUser) {
    const error = appError.create("user not found", 404, httpStatusText.FAIL);
    return next(error);
  }
  targetUser.userImage = `${process.env.BAIS_URL}/${targetUser.userImage}`;
  return res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: { user: targetUser } });
});

const userRegister = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { firstName, lastName, email, password, role, mobilePhone } = req.body;

  const oldUser = await User.findOne({ email: email });

  const mobilePhoneExist = await User.findOne({ mobilePhone: mobilePhone });

  if (mobilePhoneExist) {
    const error = appError.create(
      "mobilePhone already exists",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
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

  const newUser = new User({
    firstName,
    lastName,
    email,
    mobilePhone,
    password: hashedPassword,
    role,
  });
  const token = generateToken({
    id: newUser._id,
    role: newUser.role,
  });

  newUser.token = token;
  await newUser.save();

  const activationUrl = `${process.env.BAIS_URL}/activation/${newUser.token}`;

  await sendEmail({
    email: newUser.email,
    subject: "Activate your account",
    message: `Hello ${newUser.firstName} , please click on the link to activate your account ${activationUrl}`,
  });

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: { token: newUser.token },
    message: `please cheack your email:-${newUser.email} to activate your account`,
  });
});

const userLogin = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email: email });

  if (!user) {
    const error = appError.create("email not found", 500, httpStatusText.FAIL);
    return next(error);
  }
  const matchedPassword = await bcrypt.compare(password, user.password);

  if (user && matchedPassword) {
    const token = generateToken({
      id: user._id,
      role: user.role,
    });

    user.token = token;

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: { token: user.token, role: user.role },
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

const deleteUser = asyncWrapper(async (req, res, next) => {
  const targetUser = await User.findOne({ _id: req.params.userId });

  if (!targetUser) {
    const error = new appError.create(
      "user not found",
      404,
      httpStatusText.FAIL
    );
    return next(error);
  }
  const deletedUser = await User.deleteOne({ _id: req.params.userId });
  res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: { user: deletedUser },
  });
});

const activateUser = asyncWrapper(async (req, res, next) => {
  const { currentUser } = req;

  res.status(200).json({ currentUser });
});

module.exports = {
  getAllUsers,
  getUserProfile,
  userRegister,
  userLogin,
  updateUser,
  deleteUser,
  activateUser,
};
