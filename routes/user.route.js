const express = require("express");
const {
  getAllUsers,
  getProfile,
  register,
  login,
  updateUser,
  deleteUser,
  activateUser,
} = require("../controller/user.controller");

const registerValidation = require("../middlewares/registerValidation");
const loginValidation = require("../middlewares/loginValidation");
const verifyToken = require("../middlewares/verifyToken");
const userRoles = require("../utils/user.roles");
const alloewdTo = require("../middlewares/alloewdTo");
const multer = require("multer");
const { configureMulter, fileFilter } = require("../utils/multer");

const router = express.Router();

const upload = multer({ storage: configureMulter("users"), fileFilter });
router
  .route("/")
  .get(verifyToken, alloewdTo(userRoles.ADMIN, userRoles.MANGER), getAllUsers);

router.route("/activation").post(verifyToken, activateUser);
router.put(upload.single("userImage"), updateUser).delete(deleteUser);
router.route("/getProfile").get(verifyToken, getProfile);

router.route("/register").post(registerValidation(), register);
router.route("/login").post(loginValidation(), login);

module.exports = router;
