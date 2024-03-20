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
  getAllSellers,
  deleteSeller,
  getSellerProfile,
  getSellerProducts,
} = require("../controller/seller.controller");

const verifyToken = require("../middlewares/verifyToken");
const updateValidation = require("../middlewares/updateValidation");
const userRoles = require("../utils/user.roles");
const alloewdTo = require("../middlewares/alloewdTo");

const router = express.Router();
router.route("/").get(verifyToken, alloewdTo(userRoles.ADMIN), getAllSellers);
router.route("/register").post(registerValidation(), sellerRegister);
router.route("/login").post(loginValidation(), sellerLogin);

router.route("/getSellerProfile").get(verifyToken, getSellerProfile);

router.route("/getSellerProducts").get(verifyToken, getSellerProducts);

router
  .route("/:sellerId")
  .get(verifyToken, getSeller)
  .put(verifyToken, updateValidation(), editSeller)
  .delete(verifyToken, alloewdTo(userRoles.ADMIN), deleteSeller);

module.exports = router;
