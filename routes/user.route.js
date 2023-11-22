const express = require("express");
const {
  getAllUsers,
  register,
  login,
} = require("../controller/user.controller");
const registerValidation = require("../middlewares/registerValidation");
const loginValidation = require("../middlewares/loginValidation");
const verifyToken = require("../middlewares/verifyToken");
const userRoles = require("../utils/user.roles");
const alloewdTo = require("../middlewares/alloewdTo");

const router = express.Router();

router
  .route("/")
  .get(verifyToken, alloewdTo(userRoles.ADMIN, userRoles.MANGER), getAllUsers);
router.route("/register").post(registerValidation(), register);
router.route("/login").post(loginValidation(), login);

module.exports = router;
