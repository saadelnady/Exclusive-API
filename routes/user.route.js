const express = require("express");
const {
  getAllUsers,
  register,
  login,
} = require("../controller/user.controller");
const registerValidation = require("../middlewares/registerValidation");
const loginValidation = require("../middlewares/loginValidation");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

router.route("/").get(verifyToken, getAllUsers);
router.route("/register").post(registerValidation(), register);
router.route("/login").post(loginValidation(), login);

module.exports = router;
