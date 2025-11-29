const express = require("express");

const {
  addToWishlist,
  getWishList,
  deleteProductFromWishList,
} = require("../controller/wishList.controller.js");

const alloewdTo = require("../middlewares/alloewdTo.js");
const { roles } = require("../utils/constants.js");
const verifyToken = require("../middlewares/verifyToken.js");

const Router = express.Router();

Router.route("/").post(verifyToken, alloewdTo(roles.USER), addToWishlist);
Router.route("/:userId")
  .get(verifyToken, alloewdTo(roles.USER), getWishList)
  .delete(verifyToken, alloewdTo(roles.USER), deleteProductFromWishList);

module.exports = Router;
