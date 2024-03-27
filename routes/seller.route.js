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
const userRoles = require("../utils/user.roles");
const alloewdTo = require("../middlewares/alloewdTo");
const {
  editProfileValidation,
} = require("../middlewares/editProfileValidation");

const router = express.Router();

const multer = require("multer");
const { storage, fileFilter } = require("../utils/multer");
const upload = multer({ storage: storage, fileFilter });

router.route("/").get(verifyToken, alloewdTo(userRoles.ADMIN), getAllSellers);
router.route("/register").post(registerValidation(), sellerRegister);
router.route("/login").post(loginValidation(), sellerLogin);

router.route("/getSellerProfile").get(verifyToken, getSellerProfile);

router.route("/getSellerProducts").get(verifyToken, getSellerProducts);

router
  .route("/:sellerId")
  .get(verifyToken, getSeller)
  .delete(verifyToken, alloewdTo(userRoles.ADMIN), deleteSeller);

router
  .route("/:sellerId")
  .put(
    verifyToken,
    upload.single("image"),
    editProfileValidation(),
    editSeller
  );
module.exports = router;
