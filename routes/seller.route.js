const express = require("express");
const registerValidation = require("../middlewares/registerValidation");
const { sellerRegister } = require("../controller/seller.controller");
const router = express.Router();

router.route("/register").post(sellerRegister);
// router.route("/login").post();

module.exports = router;
