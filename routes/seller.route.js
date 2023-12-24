const express = require("express");
const registerValidation = require("../middlewares/registerValidation");
const loginValidation = require("../middlewares/loginValidation");
const {
  sellerRegister,
  loginSeller,
} = require("../controller/seller.controller");
const router = express.Router();

router.route("/register").post(registerValidation(), sellerRegister);
router.route("/login").post(loginValidation(), loginSeller);

module.exports = router;
