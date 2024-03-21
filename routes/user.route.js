const express = require("express");
const {
  getAllUsers,
  getUserProfile,
  userRegister,
  userLogin,
  editUser,
  deleteUser,
  activateUser,
} = require("../controller/user.controller");

const {
  registerValidation,
  loginValidation,
} = require("../middlewares/authValidation");
const verifyToken = require("../middlewares/verifyToken");
const userRoles = require("../utils/user.roles");
const alloewdTo = require("../middlewares/alloewdTo");
const multer = require("multer");
const { storage, fileFilter } = require("../utils/multer");

const router = express.Router();

const upload = multer({ storage: storage, fileFilter });
router.route("/").get(verifyToken, alloewdTo(userRoles.ADMIN), getAllUsers);

router.route("/activation").post(verifyToken, activateUser);
router
  .route("/:userId")
  .put(upload.single("image"), editUser)
  .delete(deleteUser);

router.route("/getUserProfile").get(verifyToken, getUserProfile);

router.route("/register").post(registerValidation(), userRegister);
router.route("/login").post(loginValidation(), userLogin);

module.exports = router;
