const express = require("express");
const {
  registerValidation,
  loginValidation,
} = require("../middlewares/authValidation");
const {
  sellerRegister,
  sellerLogin,
  getSeller,
  editSeller,
  getSellerProducts,
  getAllSellers,
  deleteSeller,
  getSellerProfile,
  verifySeller,
  resendVerificationCode,
  getSellerStatistics,
  getSellerNotifications,
  forgetSellerPassword,
  resetSellerPassword,
  verifyResetCode,
} = require("../controller/seller.controller.js");

const verifyToken = require("../middlewares/verifyToken");
const { roles } = require("../utils/constants");
const alloewdTo = require("../middlewares/alloewdTo");
const {
  editProfileValidation,
} = require("../middlewares/editProfileValidation");

const router = express.Router();

router
  .route("/")
  .get(verifyToken, alloewdTo(roles.ADMIN, roles.SUPER_ADMIN), getAllSellers);

router.route("/getSellerProducts").get(getSellerProducts);

router.route("/getProfile").get(verifyToken, getSellerProfile);
router.route("/register").post(registerValidation(), sellerRegister);
router.route("/login").post(loginValidation(), sellerLogin);
router.route("/otp").post(verifySeller);
router.route("/resendVerification").post(resendVerificationCode);

router.post("/forgetPassword", forgetSellerPassword);
router.post("/verifyResetCode", verifyResetCode);
router.post("/resetPassword", resetSellerPassword);

router
  .route("/notifications")
  .get(verifyToken, alloewdTo(roles.SELLER), getSellerNotifications);

router.route("/statistics/:sellerId").get(verifyToken, getSellerStatistics);
router
  .route("/:sellerId")
  .get(getSeller)
  .put(verifyToken, editProfileValidation(), editSeller)
  .delete(verifyToken, alloewdTo(roles.ADMIN, roles.SUPER_ADMIN), deleteSeller);

module.exports = router;
